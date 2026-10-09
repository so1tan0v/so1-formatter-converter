/**
 * Номер счётчика Яндекс.Метрики. Меняется только здесь.
 */
export const YANDEX_METRIKA_COUNTER_ID = 113517806;

const ENABLED_FLAGS = new Set(['1', 'true', 'yes', 'on']);

/**
 * Читает YANDEX_METRIKA_ENABLED. Пустое значение и всё, кроме 1/true/yes/on, выключает счётчик.
 *
 * @param raw Значение переменной. Без аргумента берётся из окружения
 */
export function isYandexMetrikaEnabled(
  raw: string | undefined = readYandexMetrikaFlag(),
): boolean {
  if (raw === undefined) {
    return false;
  }

  return ENABLED_FLAGS.has(raw.trim().toLowerCase());
}

/**
 * Собирает официальный фрагмент счётчика: загрузчик, init и пиксель для браузеров без JavaScript
 *
 * @param counterId Номер счётчика
 * @param enabled Подставлять ли счётчик в страницу
 */
export function yandexMetrikaCounterHtml(
  counterId: number = YANDEX_METRIKA_COUNTER_ID,
  enabled: boolean = isYandexMetrikaEnabled(),
): string {
  if (!enabled) {
    return '';
  }

  return `    <!-- Yandex.Metrika counter -->
    <script type="text/javascript">
      (function(m,e,t,r,i,k,a){
          m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
          m[i].l=1*new Date();
          for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
          k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
      })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=${counterId}', 'ym');

      ym(${counterId}, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});
    </script>
    <noscript><div><img src="https://mc.yandex.ru/watch/${counterId}" style="position:absolute; left:-9999px;" alt="" /></div></noscript>
    <!-- /Yandex.Metrika counter -->`;
}

function readYandexMetrikaFlag(): string | undefined {
  if (typeof process === 'undefined') {
    return undefined;
  }

  return process.env.YANDEX_METRIKA_ENABLED;
}
