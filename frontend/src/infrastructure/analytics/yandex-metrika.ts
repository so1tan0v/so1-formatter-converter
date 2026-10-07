/**
 * Номер счётчика Яндекс.Метрики. Меняется только здесь.
 */
export const YANDEX_METRIKA_COUNTER_ID = 113517806;

/**
 * Собирает официальный фрагмент счётчика: загрузчик, init и пиксель для браузеров без JavaScript
 *
 * @param counterId Номер счётчика
 */
export function yandexMetrikaCounterHtml(
  counterId: number = YANDEX_METRIKA_COUNTER_ID,
): string {
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
