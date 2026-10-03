import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalLayout, OWNER_SITE } from "@/components/site-chrome";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Məxfilik siyasəti — APK Studio" },
      {
        name: "description",
        content:
          "APK Studio hansı məlumatları göndərir, harada emal edir və nə vaxt silir — açıq və sadə izah.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalLayout title="Məxfilik siyasəti" updated="3 oktyabr 2026">
      <p>
        Bu səhifə APK Studio-nun (“xidmət”) məlumatlarla necə işlədiyini izah edir. Xidmət sayt
        ünvanını və ya statik sayt ZIP-ini Android tətbiqinə (APK / AAB) çevirir.
      </p>

      <h2>1. Hansı məlumatlar göndərilir</h2>
      <p>“APK düzəlt” düyməsinə basdıqda aşağıdakılar build xidmətimizə göndərilir:</p>
      <ul>
        <li>sayt ünvanı (URL) və ya yüklədiyiniz statik sayt ZIP faylı;</li>
        <li>tətbiqin ikonu (əgər seçmisinizsə);</li>
        <li>tətbiqin adı, paket adı, versiya, ekran istiqaməti, dil, məxfilik siyasəti URL-i və digər tətbiq parametrləri.</li>
      </ul>
      <p>
        “Build kit ZIP-i endir” düyməsi isə paketi yalnız brauzerinizdə yaradır və heç bir yerə
        göndərmir.
      </p>

      <h2>2. Harada emal olunur</h2>
      <p>
        Fayllar əvvəlcə saytımızın serverinə (Vercel üzərində), oradan isə APK-nın yığılması üçün{" "}
        <strong>şəxsi (private) GitHub build repozitoriyasına</strong> ötürülür və GitHub Actions
        mühitində emal edilir. Hazır APK/AAB faylı həmin repozitoriyada müvəqqəti saxlanılır və
        yükləmə linki saytımız vasitəsilə verilir. İstifadəçi tərəfə GitHub ünvanı göstərilmir.
        Yükləmə linki təxmin edilməsi mümkün olmayan təsadüfi identifikatordan ibarətdir; linki bilən
        hər kəs faylı yükləyə bilər, buna görə linki paylaşarkən ehtiyatlı olun.
      </p>

      <h2>3. Məlumatlar nə qədər saxlanılır</h2>
      <ul>
        <li>
          Yüklənmiş fayllar build üçün müvəqqəti iş branch-ində saxlanılır və build bitdikdən dərhal
          sonra (uğurlu və ya uğursuz) silinir. Yarımçıq qalan iş branch-ləri gündəlik təmizləmə ilə
          təxminən 6 saatdan sonra silinir.
        </li>
        <li>
          Hazır APK/AAB faylı <strong>7 gündən sonra</strong> avtomatik silinir (təmizləmə gündə bir
          dəfə işlədiyi üçün real müddət bir neçə saat uzun ola bilər). Build artefaktı isə GitHub-da
          cəmi 1 gün saxlanılır.
        </li>
        <li>
          GitHub Actions iş jurnalları (texniki build çıxışı: fayl yolları, tətbiq və paket adı kimi)
          GitHub-ın standart saxlama müddəti qədər qala bilər. Silinmiş fayllar GitHub-ın daxili
          təmizləməsinə qədər sistemdə texniki qalıqlar kimi mövcud ola bilər.
        </li>
        <li>
          Brauzerinizdə yalnız davam edən build-in identifikatoru (səhifə yenilənəndə işi davam
          etdirmək üçün, ən çox 2 saat) yerli yaddaşda saxlanılır.
        </li>
      </ul>

      <h2>4. Hesab, reklam, satış</h2>
      <ul>
        <li>Xidmətdən istifadə üçün hesab və ya qeydiyyat tələb olunmur.</li>
        <li>Reklam göstərmirik və öz analitika / izləmə alətlərimiz yoxdur.</li>
        <li>Məlumatlarınızı satmırıq və reklam məqsədilə üçüncü tərəflərə vermirik.</li>
      </ul>

      <h2>5. Server jurnalları və IP ünvanı</h2>
      <p>
        Təhlükəsizlik və sui-istifadənin qarşısını almaq üçün sorğuların sürətini məhdudlaşdırırıq; bunun
        üçün IP ünvanınız qısa müddətə serverin yaddaşında istifadə olunur. Hosting provayderi (Vercel)
        və GitHub öz texniki jurnallarını öz siyasətlərinə uyğun tuta bilər. Səhifələr şrift
        yükləmək üçün Google Fonts-a müraciət edir; yerləşdirmə platformasının öz interfeys elementləri
        də üçüncü tərəf resursları yükləyə bilər.
      </p>

      <h2>6. Sizin məsuliyyətiniz</h2>
      <p>
        Yüklədiyiniz məzmunun qanuni olmasına və üçüncü tərəfin hüquqlarını pozmamasına siz
        cavabdehsiniz. Tətbiqinizin öz məxfilik siyasətini hazırlamaq və mağaza tələblərinə uyğunluq
        da sizin öhdəliyinizdir. Əlavə şərtlər üçün{" "}
        <Link to="/terms">istifadə qaydalarına</Link> baxın.
      </p>

      <h2>7. Əlaqə</h2>
      <p>
        Suallar və silmə sorğuları üçün{" "}
        <a href={OWNER_SITE} target="_blank" rel="noopener noreferrer">
          nibrascode.com
        </a>{" "}
        ünvanı vasitəsilə əlaqə saxlayın.
      </p>
    </LegalLayout>
  );
}
