import { createConverterRegistry } from '@infrastructure/converters/registry';
import { createFormatterRegistry } from '@infrastructure/formatters/registry';
import { LocalStorageHistoryStore } from '@infrastructure/history/local-storage.history-store';
import { createViewerRegistry } from '@infrastructure/viewers/registry';

export const formatterRegistry = createFormatterRegistry();
export const converterRegistry = createConverterRegistry();
export const viewerRegistry = createViewerRegistry();

export const historyStore = new LocalStorageHistoryStore(window.localStorage);
