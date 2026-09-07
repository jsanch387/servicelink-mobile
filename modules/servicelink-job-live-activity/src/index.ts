import { requireNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

type ServicelinkJobLiveActivityNativeModule = {
  isAvailable(): boolean;
  startJobTimer(
    bookingId: string,
    customerName: string,
    serviceName: string,
    startedAtMs: number,
  ): Promise<void>;
  endJobTimer(bookingId: string): Promise<void>;
};

let nativeModule: ServicelinkJobLiveActivityNativeModule | null | undefined;

function getNativeModule(): ServicelinkJobLiveActivityNativeModule | null {
  if (Platform.OS !== 'ios') {
    return null;
  }
  if (nativeModule !== undefined) {
    return nativeModule;
  }
  try {
    nativeModule = requireNativeModule('ServicelinkJobLiveActivity');
  } catch {
    nativeModule = null;
  }
  return nativeModule;
}

/** True when the Expo native module is compiled into the current app binary. */
export function isJobLiveActivityNativeModuleLinked(): boolean {
  return getNativeModule() != null;
}

export function isJobLiveActivityAvailable(): boolean {
  const module = getNativeModule();
  if (!module) {
    return false;
  }
  try {
    return module.isAvailable();
  } catch {
    return false;
  }
}

export async function startJobLiveActivityNative(input: {
  bookingId: string;
  customerName: string;
  serviceName: string;
  startedAtMs: number;
}): Promise<void> {
  const module = getNativeModule();
  if (!module) {
    return;
  }
  await module.startJobTimer(
    input.bookingId,
    input.customerName,
    input.serviceName,
    input.startedAtMs,
  );
}

export async function endJobLiveActivityNative(bookingId = ''): Promise<void> {
  const module = getNativeModule();
  if (!module) {
    return;
  }
  await module.endJobTimer(bookingId);
}
