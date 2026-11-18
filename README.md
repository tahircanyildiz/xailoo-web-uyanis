# Xailoo Uyanış: web sitesi açılış animasyonu

Bu paket, Xailoo mobil uygulamasının açılış animasyonunun ("Uyanış") web sürümü. Site açılırken simsiyah ekranda Xailoo oyuncağının LED yüzü uyanır, ardından XAILOO logosu ve alt yazı belirir. Görüntüyle birlikte imza sesi çalar. Animasyon yaklaşık 6,75 saniye sürer, sonra siyah katman kararıp kalkar ve site görünür.

Zamanlama, LED desenleri, renkler ve oranlar uygulamadaki kaynakla aynıdır. Hiçbir kütüphane gerektirmez: tek bir JS dosyası, tek bir CSS dosyası, bir logo ve bir ses dosyası. Herhangi bir siteye eklenebilir: düz HTML, WordPress, React/Next.js ya da başka bir altyapı.

Paket iki hazır sürümle gelir. Dosyalar ortaktır, sürümler yalnızca başlatma ayarında ayrılır. Sitede hangisinin kullanılacağını Xailoo ekibi belirler.

| Sürüm | Nasıl başlar | Ses |
|---|---|---|
| **A. Kapılı, sesli** | Siyah ekranda ortada **"Xailoo'yu uyandır"** düğmesi çıkar. Ziyaretçi basınca animasyon başlar. | İmza sesi animasyonla birlikte çalar. Ses her tarayıcıda kesin duyulur, çünkü düğmeye basmak tarayıcının sesli oynatma için beklediği etkileşimdir. |
| **B. Kapısız, sessiz** | Site açılınca animasyon hemen oynar; ziyaretçinin bir şeye basması gerekmez. | Ses yok, yalnızca görüntü. |

Neden "kapısız ama sesli" bir sürüm yok: Tarayıcılar, ziyaretçi sayfaya dokunmadan sesli oynatmaya izin vermez (bkz. [Ses ve tarayıcı kuralı](#ses-ve-tarayıcı-kuralı)). Kapısız bir sürümde ses çoğu ziyaretçide engellenirdi.

İki sürümü görmek için `demo-kapili.html` ve `demo-sessiz.html` dosyalarını bir yerel sunucuda açın (bkz. [Test](#test)).

## Dosyalar

| Dosya | Ne işe yarar |
|---|---|
| `xailoo-uyanis.js` | Animasyon, ses ve akış (bağımlılık yok, sıkıştırılmamış ~25 KB) |
| `xailoo-uyanis.css` | Siyah katman, alt yazı ve düğmelerin stili |
| `assets/xailoo-logo.png` | Logo (843×240, şeffaf) |
| `assets/xailoo-uyanis.m4a` | İmza sesi, özgün dosya (AAC, 7,8 sn, 90 KB) |
| `assets/xailoo-uyanis.mp3` | İmza sesinin MP3 kopyası (AAC çalamayan tarayıcılar için, 158 KB) |
| `demo-kapili.html` | Örnek sayfa: A. kapılı, sesli sürüm |
| `demo-sessiz.html` | Örnek sayfa: B. kapısız, sessiz sürüm |

Betik, ses ve logoyu kendi klasöründeki `assets/` altından yükler. Klasör yapısını bozmadan siteye koymanız yeterli. Sessiz sürüm kullanılacaksa ses dosyaları hiç yüklenmez.

## Kurulum

`xailoo-uyanis/` klasörünü sitenin statik dosyalarına kopyalayın (örnekte `/xailoo-uyanis/`). Ardından sayfaya dört parça ekleyin.

**1. `<head>` içine stil:**

```html
<link rel="stylesheet" href="/xailoo-uyanis/xailoo-uyanis.css">
```

**2. `<head>` içine, stilden hemen sonra, kısa karar betiği:**

Bu betik sayfa çizilmeden önce çalışır. Animasyon oynatılacaksa siyah katman ilk karede görünür ve site bir an bile görünüp kaybolmaz. Ziyaretçi animasyonu bu oturumda zaten gördüyse katman hiç çıkmaz.

```html
<script>
  (function (d, w) {
    var REPEAT = 'session'; // 'session' | 'day' | 'always'  (aşağıdaki start({ repeat }) ile aynı olmalı)
    var c = 'xu-play';
    try {
      var k = 'xailoo-uyanis';
      if (REPEAT === 'session' && w.sessionStorage.getItem(k) === '1') { c = 'xu-skip'; }
      if (REPEAT === 'day' && Date.now() - Number(w.localStorage.getItem(k)) < 864e5) { c = 'xu-skip'; }
    } catch (e) { /* depolama kapalı: oynat */ }
    d.documentElement.classList.add(c);
    // Emniyet: animasyon betiği 10 sn içinde başlamazsa katman kalkar, site kilitli kalmaz
    if (c === 'xu-play') {
      setTimeout(function () { if (!w.XailooUyanisStarted) { d.documentElement.classList.remove('xu-play'); } }, 10000);
    }
  })(document, window);
</script>
```

**3. `<body>`'nin en başına katman:**

```html
<div id="xailoo-uyanis"></div>
```

**4. `</body>`'den hemen önce betik ve başlatma.** Seçilen sürüme göre aşağıdakilerden **yalnızca birini** ekleyin.

A. Kapılı, sesli:

```html
<script src="/xailoo-uyanis/xailoo-uyanis.js"></script>
<script>
  XailooUyanis.start({
    gate: true,    // "Xailoo'yu uyandır" düğmesiyle başlar
    sound: true,   // imza sesi çalar
  });
</script>
```

B. Kapısız, sessiz:

```html
<script src="/xailoo-uyanis/xailoo-uyanis.js"></script>
<script>
  XailooUyanis.start({
    gate: false,   // site açılınca hemen başlar
    sound: false,  // ses yok, yalnız görüntü
  });
</script>
```

1–3. adımlar iki sürümde aynıdır. Hepsi bu kadar. Animasyon yalnızca bu parçaların eklendiği sayfada çalışır. Genelde yalnız ana sayfaya eklenir.

React/Next.js gibi bir altyapıda da adımlar aynıdır:
- 1. ve 2. adımdaki parçaları belgenin `<head>`'ine koyun.
- `<div id="xailoo-uyanis"></div>`'i sayfa ağacının en başına koyun.
- Betiği yükleyip `XailooUyanis.start()`'ı bir kez çağırın. Next.js'te `next/script` ile `strategy="afterInteractive"` uygundur.
- 2. adımdaki karar betiği satır içi kalmalıdır; asıl betikle birlikte sonradan yüklenirse site bir an görünüp siyaha döner.

## Ses ve tarayıcı kuralı

Bütün güncel tarayıcılar (Chrome, Safari, Firefox, Edge), ziyaretçi sayfaya hiç dokunmadan, tıklamadan ya da tuşa basmadan bir sitenin **sesli** oynatma yapmasını engeller. Bu kural tarayıcıdadır, siteden kapatılamaz. YouTube ve Netflix gibi siteler de aynı nedenle videoyu ya sessiz başlatır ya da bir tıklama bekler.

İki sürüm bu kurala göre tasarlandı:
- **A. Kapılı, sesli:** "Xailoo'yu uyandır" düğmesine basmak tarayıcının beklediği etkileşimdir. Bu yüzden ses her tarayıcıda animasyonun ilk karesiyle birlikte çalar.
- **B. Kapısız, sessiz:** Ses hiç yüklenmez ve çalınmaz. Engellenecek bir şey olmadığından her tarayıcıda aynı görünür.

iPhone'da cihazın sessiz düğmesi açıksa A sürümünde de ses duyulmaz.

İstenirse üçüncü bir ara biçim de mümkündür: `gate: false, sound: true`. Bu biçimde animasyon hemen başlar, ses yalnızca tarayıcı izin verirse çalar. İzin vermezse sol altta "Sesi aç" düğmesi çıkar; basılınca ses görüntüyle eşzamanlı olarak, animasyonun o anki yerinden başlar. Tarayıcı ancak iki durumda izin verir: ziyaretçi o sekmede sitede daha önce bir yere tıkladıysa, ya da masaüstü Chrome'da siteye daha önce sık geldiyse. Siteye ilk kez gelen ziyaretçide ses genelde engellenir.

## Ayarlar

`XailooUyanis.start({ ... })`'a verilebilecekler:

| Ayar | Varsayılan | Açıklama |
|---|---|---|
| `gate` | `false` | `true`: "Xailoo'yu uyandır" düğmesiyle başlar, ses kesin çalar |
| `sound` | `true` | `false`: sessiz |
| `volume` | `1` | Ses düzeyi, 0–1. Dosya −3 dBFS'e normalize edilmiştir. |
| `repeat` | `'session'` | Ne sıklıkla oynasın: `'session'` tarayıcı oturumu başına bir kez, `'day'` günde bir, `'always'` her açılışta. 2. adımdaki `REPEAT` ile aynı olmalı. |
| `tagline` | `'Her çocuğun potansiyeline inanıyoruz.'` | Logonun altındaki yazı. `''` verilirse yazı çıkmaz. |
| `maxWidth` | `430` | Yüzün ve logonun ölçüldüğü en büyük genişlik (px). Uygulamadaki değer 430'dur; masaüstünde daha büyük görünmesi istenirse ör. `560`. |
| `skippable` | `true` | Sağ alttaki "Geç" düğmesi |
| `skipLabel`, `soundLabel`, `gateLabel` | `'Geç'`, `'Sesi aç'`, `'Xailoo\'yu uyandır'` | Düğme yazıları |
| `root` | `'#xailoo-uyanis'` | Katman öğesi ya da seçicisi |
| `assetsPath` | betiğin klasörü + `assets/` | Varlıklar başka yerdeyse (ör. CDN) |
| `logoSrc`, `soundSrc` | — | Logo ya da ses için tam adres |
| `onEnd` | — | Katman kalkınca çağrılır |
| `freezeAt` | — | Yalnız inceleme için: animasyonu bu milisaniyede dondurur, ses çalmaz |

Yazı tipi CSS değişkeniyle sitenin yazı tipine bağlanabilir:

```css
:root { --xu-font: "Sitenin Yazı Tipi", system-ui, sans-serif; }
```

## Davranışlar

- **Sayfa kaydırması:** Animasyon sürerken kilitlenir, bitince açılır.
- **Ses yükleme (A sürümü):** Animasyon, sesin ve logonun yüklenmesini en çok 1,2 sn bekler. İlk 375 ms zaten siyah olduğu için bu bekleme fark edilmez. Ses daha geç yüklenirse görüntüyle eşzamanlı olacak şekilde kaldığı yerden başlar.
- **Geçmek:** "Geç" düğmesi ya da Esc tuşu animasyonu geçer, ses kısılarak durur.
- **Normal bitiş:** Sesin son ~1 saniyelik kuyruğu, katman kalktıktan sonra da sürer; kesilmez.
- **Arka plan sekmesi:** Sekme arka planda açıldıysa animasyon, ziyaretçi sekmeye gelince başlar. Animasyon sürerken sekme arka plana alınırsa animasyon geçilir.
- **Hareketi azalt:** Ziyaretçinin işletim sisteminde "Hareketi azalt" açıksa (`prefers-reduced-motion`) animasyon ve ses oynamaz, A sürümünde düğme de çıkmaz. Son kare (açık gözler, logo, alt yazı) 0,8 sn görünür ve 0,3 sn'de söner.
- **JavaScript kapalıysa** katman hiç görünmez.
- **Betik yüklenemezse:** 2. adımdaki emniyet, katmanı 10 sn sonra kaldırır; site kilitli kalmaz.
- **Ekran döndürme ve boyut değişimi:** Çizim yeniden ölçeklenir. Retina ekranlarda keskin çizer.
- **Arama motorları:** Sitenin içeriği HTML'de olduğu gibi kalır. Katman yalnızca görseldir.

## JavaScript arayüzü

```js
XailooUyanis.start(options)   // Promise döner; animasyon bitince ya da geçilince çözülür
XailooUyanis.skip()           // çalan animasyonu geçer
document.addEventListener('xailoo-uyanis:end', () => { /* katman kalktı */ });
```

Katman öğesinin `data-sound` özniteliği ses durumunu gösterir: `loading`, `playing`, `blocked` (tarayıcı engelledi) ya da `off`. Hata ayıklarken işe yarar.

## Zaman çizelgesi

Uygulamadakiyle aynı (ms, ilk kareden itibaren). Ses sütunu yalnız A sürümü için geçerlidir.

| ms | Görüntü | Ses |
|---|---|---|
| 0–375 | Siyah | — |
| 375–900 | Ortada iki LED (açık aqua) yanar, ince yatay ışık izi büyür | İnce çınlama |
| 900–1350 | Işık iki yana yayılır, iz ekranı aşar | Hafif parıltı |
| 1350–1830 | Gözler kapalı, sonra yarı açık | — |
| 1830–2130 | Gözler açılır ve parlar; merkezde yumuşak parlama | **Xailoo imzası** |
| 2130–3210 | Sola, sonra sağa bakar | — |
| 3210–4350 | Sevinir (∩∩ gözler, zıplar) | İki küçük "bloop" |
| 3525–4350 | XAILOO logosu belirir | Parıltı arpeji |
| 4450–5150 | Alt yazı belirir, hafif yukarı kayar | Yumuşak kapanış akoru |
| 4350–6350 | Gözler boşta, göz kırpar; logo ve alt yazı ekranda | Kuyruk |
| 6350–6750 | Siyah katman söner, site görünür | Ses 7,8 sn'de biter |

## Tasarım değerleri

- **Arka plan:** `#000`.
- **Renkler:** LED parıltısı `#41dbdb`; kıvılcım ve parlama `#beffff`; alt yazı `#c0dbd9`, ağırlık 500.
- **Ölçü tabanı:** `base = min(ekran genişliği, maxWidth, ekran yüksekliği × 0,75)`.
  - LED kenarı `base × 0,074`; yatay aralık LED × 0,62; dikey aralık LED × 0,7; köşe yarıçapı LED × 0,42.
  - Logo genişliği `base × 0,46`; alt yazı boyu `base × 0,052`.
  - Yükseklik sınırı (`× 0,75`) web'e özgü bir ektir: yatay telefonda yüz ile logonun üst üste binmesini önler. Dikey telefonda ve masaüstünde etkisi yoktur.
- **Dikey yerleşim:** Yüzün merkezi ekran yüksekliğinin %40'ında, logo %66'sında, alt yazı %73,5'inde.
- **Alt yazının satırları:** Ekran genişliğinin %84'üne sığmazsa ortaya en yakın boşluktan iki satıra bölünür, yazı küçülmez. Telefonda iki satır, masaüstünde tek satır olur.

## Sunucu notları

- Ses dosyaları doğru türle sunulmalı: `.m4a` → `audio/mp4`, `.mp3` → `audio/mpeg`. Çoğu sunucu bunu zaten yapar.
- Dosyalar değişmeyeceği için uzun önbellek süresi verilebilir.
- Ses dosyaları başka bir alan adından (CDN) sunuluyorsa normal `<audio>` kuralları geçerlidir; ek bir CORS ayarı gerekmez.

## Test

Yerel sunucuda açın; tarayıcıda doğrudan dosya olarak açmak ses için güvenilir değildir:

```bash
cd xailoo-uyanis
python3 -m http.server 8765
# http://localhost:8765/demo-kapili.html
# http://localhost:8765/demo-sessiz.html
```

- `demo-kapili.html`: A. kapılı, sesli sürüm.
- `demo-sessiz.html`: B. kapısız, sessiz sürüm.
- Her iki sayfadaki "Animasyonu tekrar oynat" düğmesi oturum kaydını silip animasyonu yeniden oynatır.
- `?kare=1900` eki tek bir kareyi dondurur; karşılaştırma için kullanılır. Örnek değerler: 700 kıvılcım, 1100 ışık çizgisi, 1900 gözler açılıyor, 2400 sola bakış, 3500 sevinç, 5200 logo ve alt yazı.

Yayına almadan önce kontrol listesi:
- [ ] Masaüstü Chrome ve Safari'de, iPhone Safari'de ve Android Chrome'da baştan sona oynuyor.
- [ ] Animasyon bitince sayfa kayıyor, bağlantılar tıklanıyor.
- [ ] Aynı oturumda ana sayfaya dönünce animasyon tekrar oynamıyor (`repeat: 'session'`).
- [ ] "Geç" ve Esc çalışıyor.
- [ ] A sürümünde "Xailoo'yu uyandır"a basınca animasyon ve ses birlikte başlıyor.
- [ ] B sürümünde animasyon site açılınca hemen başlıyor, ses çalmıyor, "Sesi aç" düğmesi çıkmıyor.
- [ ] Sistemde "Hareketi azalt" açıkken yalnız son kare kısa süre görünüyor.
