import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppText, SurfaceTextField } from '../../../components/ui';
import { useTheme } from '../../../theme';
import {
  formatLocationDisplay,
  formatLocationSuggestionKind,
  hasMapTilerApiKey,
  searchLocations,
} from '../services/locationAutocomplete';

const MIN_AUTOCOMPLETE_QUERY_LENGTH = 3;
const AUTOCOMPLETE_DEBOUNCE_MS = 450;

/**
 * MapTiler-backed location search field with suggestion list.
 *
 * @param {{
 *   value: string;
 *   onChangeText: (value: string) => void;
 *   onSelect: (location: import('../types/location').StructuredLocation) => void;
 *   selectedLocation?: import('../types/location').StructuredLocation | null;
 *   label?: string;
 *   placeholder?: string;
 *   errorText?: string;
 *   containerStyle?: object;
 * }} props
 */
export function LocationAutocompleteField({
  value,
  onChangeText,
  onSelect,
  selectedLocation = null,
  label = 'Location',
  placeholder = 'Search city or address',
  errorText,
  containerStyle,
}) {
  const { colors, isDark } = useTheme();
  const suppressSearchUntilEditRef = useRef(false);
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasCompletedSearch, setHasCompletedSearch] = useState(false);
  const [providerError, setProviderError] = useState('');

  const trimmedValue = value.trim();
  const showSuggestions =
    isFocused &&
    !selectedLocation &&
    trimmedValue.length >= MIN_AUTOCOMPLETE_QUERY_LENGTH &&
    (isLoading || hasCompletedSearch || Boolean(providerError) || suggestions.length > 0);

  useEffect(() => {
    if (suppressSearchUntilEditRef.current) {
      setSuggestions([]);
      setProviderError('');
      setHasCompletedSearch(false);
      setIsLoading(false);
      return undefined;
    }

    if (!isFocused || selectedLocation || trimmedValue.length < MIN_AUTOCOMPLETE_QUERY_LENGTH) {
      setSuggestions([]);
      setProviderError('');
      setIsLoading(false);
      setHasCompletedSearch(false);
      return undefined;
    }

    if (!hasMapTilerApiKey()) {
      setProviderError('Location suggestions are not configured.');
      setSuggestions([]);
      setHasCompletedSearch(false);
      return undefined;
    }

    const controller = new AbortController();
    setSuggestions([]);
    setHasCompletedSearch(false);

    const timeout = setTimeout(async () => {
      setIsLoading(true);
      setProviderError('');

      try {
        const locations = await searchLocations(trimmedValue, {
          mode: 'service-origin',
          signal: controller.signal,
        });
        setSuggestions(locations);
        setHasCompletedSearch(true);
      } catch (requestError) {
        if (requestError?.name === 'AbortError') return;
        setSuggestions([]);
        setProviderError('Location suggestions are unavailable.');
        setHasCompletedSearch(false);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, AUTOCOMPLETE_DEBOUNCE_MS);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [isFocused, selectedLocation, trimmedValue]);

  const pickLocation = (location) => {
    suppressSearchUntilEditRef.current = true;
    setSuggestions([]);
    setProviderError('');
    setHasCompletedSearch(false);
    setIsFocused(false);
    onSelect(location);
  };

  const pressedBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
  const iconBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
  const [fieldHeight, setFieldHeight] = useState(0);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          position: 'relative',
          zIndex: showSuggestions ? 40 : 1,
        },
        fieldWrap: {
          zIndex: 1,
        },
        suggestions: {
          backgroundColor: colors.cardSurface,
          borderColor: colors.borderStrong,
          borderRadius: 14,
          borderWidth: 1,
          elevation: 24,
          left: 0,
          maxHeight: 220,
          overflow: 'hidden',
          position: 'absolute',
          right: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDark ? 0.4 : 0.12,
          shadowRadius: 16,
          top: fieldHeight > 0 ? fieldHeight + 8 : '100%',
          width: '100%',
          zIndex: 50,
        },
        suggestionScroll: {
          flexGrow: 0,
          maxHeight: 188,
        },
        suggestionScrollContent: {
          flexGrow: 0,
          paddingVertical: 4,
        },
        rowPressable: {
          width: '100%',
        },
        row: {
          alignItems: 'center',
          flexDirection: 'row',
          paddingHorizontal: 12,
          paddingVertical: 10,
          width: '100%',
        },
        rowPressed: {
          backgroundColor: pressedBg,
        },
        iconBadge: {
          alignItems: 'center',
          backgroundColor: iconBg,
          borderRadius: 16,
          height: 32,
          justifyContent: 'center',
          marginRight: 12,
          width: 32,
        },
        textCol: {
          flexGrow: 1,
          flexShrink: 1,
        },
        title: {
          color: colors.text,
          fontSize: 14,
          fontWeight: '600',
          lineHeight: 18,
        },
        subtitle: {
          color: colors.textMuted,
          fontSize: 12,
          fontWeight: '500',
          lineHeight: 16,
          marginTop: 2,
        },
        footer: {
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          paddingHorizontal: 14,
          paddingVertical: 8,
        },
        footerText: {
          color: colors.textMuted,
          fontSize: 11,
          fontWeight: '500',
        },
      }),
    [colors, fieldHeight, iconBg, isDark, pressedBg, showSuggestions],
  );

  const renderStatusRow = (iconNode, title, subtitle, titleColor) => (
    <View style={styles.row}>
      <View style={styles.iconBadge}>{iconNode}</View>
      <View style={styles.textCol}>
        <AppText style={[styles.title, titleColor ? { color: titleColor } : null]}>{title}</AppText>
        {subtitle ? <AppText style={styles.subtitle}>{subtitle}</AppText> : null}
      </View>
    </View>
  );

  return (
    <View style={[styles.root, containerStyle]}>
      <View
        style={styles.fieldWrap}
        onLayout={(event) => {
          const nextHeight = event.nativeEvent.layout.height;
          if (nextHeight > 0 && nextHeight !== fieldHeight) {
            setFieldHeight(nextHeight);
          }
        }}
      >
        <SurfaceTextField
          autoCapitalize="words"
          autoCorrect={false}
          compact
          containerStyle={{ marginBottom: 0 }}
          errorText={errorText}
          label={label}
          leftIcon="search-outline"
          placeholder={placeholder}
          value={value}
          onBlur={() => {
            setTimeout(() => setIsFocused(false), 180);
          }}
          onChangeText={(next) => {
            suppressSearchUntilEditRef.current = false;
            setIsFocused(true);
            onChangeText(next);
          }}
          onFocus={() => setIsFocused(true)}
        />
      </View>

      {showSuggestions ? (
        <View style={styles.suggestions}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            bounces={false}
            style={styles.suggestionScroll}
            contentContainerStyle={styles.suggestionScrollContent}
          >
            {isLoading && suggestions.length === 0
              ? renderStatusRow(
                  <ActivityIndicator color={colors.textMuted} size="small" />,
                  'Finding locations',
                  'Searching nearby places…',
                )
              : providerError
                ? renderStatusRow(
                    <Ionicons color={colors.danger} name="alert-circle-outline" size={16} />,
                    providerError,
                    null,
                    colors.danger,
                  )
                : suggestions.length === 0
                  ? renderStatusRow(
                      <Ionicons color={colors.textMuted} name="location-outline" size={16} />,
                      'No locations found',
                      'Check the spelling or try a nearby ZIP code.',
                    )
                  : suggestions.map((location) => (
                      <Pressable
                        key={location.providerId}
                        accessibilityRole="button"
                        style={styles.rowPressable}
                        onPress={() => pickLocation(location)}
                      >
                        {({ pressed }) => (
                          <View style={[styles.row, pressed ? styles.rowPressed : null]}>
                            <View style={styles.iconBadge}>
                              <Ionicons
                                color={colors.textMuted}
                                name="location-outline"
                                size={16}
                              />
                            </View>
                            <View style={styles.textCol}>
                              <AppText numberOfLines={1} style={styles.title}>
                                {formatLocationDisplay(location)}
                              </AppText>
                              <AppText numberOfLines={1} style={styles.subtitle}>
                                {formatLocationSuggestionKind(location.placeType)}
                              </AppText>
                            </View>
                          </View>
                        )}
                      </Pressable>
                    ))}
          </ScrollView>
          <View style={styles.footer}>
            <AppText style={styles.footerText}>US locations · Powered by MapTiler</AppText>
          </View>
        </View>
      ) : null}
    </View>
  );
}
