/**
 * Imports from packages
 */
import { useDispatch, useSelector } from 'react-redux';

/**
 * Imports from presentation
 */
import type { AppDispatch, RootState } from '@presentation/store/index';

/**
 * Возвращает типизированную функцию dispatch хранилища приложения
 */
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();

/**
 * Выбирает данные из состояния Redux-хранилища приложения
 *
 * @param selector Функция, которая читает нужный срез состояния
 */
export const useAppSelector = useSelector.withTypes<RootState>();
