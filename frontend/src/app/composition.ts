/**
 * Imports from infrastructure
 */
import { createConverterRegistry } from '@infrastructure/converters/registry';
import { createFormatterRegistry } from '@infrastructure/formatters/registry';
import { LocalStorageHistoryStore } from '@infrastructure/history/local-storage.history-store';
import { createViewerRegistry } from '@infrastructure/viewers/registry';

/**
 * Реестр форматтеров приложения
 */
export const formatterRegistry = createFormatterRegistry();

/**
 * Реестр конвертеров приложения
 */
export const converterRegistry = createConverterRegistry();

/**
 * Реестр просмотрщиков приложения
 */
export const viewerRegistry = createViewerRegistry();

/**
 * Хранилище истории ввода в localStorage
 */
export const historyStore = new LocalStorageHistoryStore(window.localStorage);
