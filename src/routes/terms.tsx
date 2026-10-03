import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalLayout, OWNER_SITE } from "@/components/site-chrome";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "İstifadə qaydaları və məsuliyyətdən imtina — APK Studio" },
      {
        name: "description",
        content:
          "APK Studio-dan istifadə qaydaları: qadağan olunmuş istifadə, məsuliyyətdən imtina və xidmətin “olduğu kimi” təqdimatı.",
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalLayout title="İstifadə qaydaları və məsuliyyətdən imtina" updated="3 oktyabr 2026">
      <p>
        APK Studio-dan istifadə etməklə aşağıdakı qaydalarla razılaşmış olursunuz. Razı deyilsinizsə,
        xidmətdən istifadə etməyin.
      </p>

      <h2>1. Qadağan olunmuş istifadə</h2>
      <p className="legal-warning">
        Zərərli tətbiqlər hazırlamaq qadağandır.
      </p>
      <p>Xidmətdən aşağıdakı məqsədlərlə istifadə etmək qadağandır:</p>
      <ul>
        <li>zərərli proqram (malware), casus proqram (spyware), virus, fidyə proqramı;</li>
        <li>fişinq, saxta saytların və ya tətbiqlərin təqlidi, dələduzluq;</li>
        <li>başqasının məzmununun icazəsiz istifadəsi (oğurlanmış məzmun), müəllif hüququnun pozulması;</li>
        <li>qanunsuz, aldadıcı, zorakılığa, nifrətə və ya istismara çağıran məzmun;</li>
        <li>istifadəçilərin razılığı olmadan məlumat toplayan və ya cihaza zərər verən tətbiqlər.</li>
      </ul>
      <p>
        Qaydalar pozularsa, build sorğuları xəbərdarlıq edilmədən rədd edilə, fayllar silinə və
        giriş məhdudlaşdırıla bilər. Qanunsuz fəaliyyət barədə səlahiyyətli orqanlara məlumat verilə bilər.
      </p>

      <h2>2. Sizin məsuliyyətiniz</h2>
      <ul>
        <li>Tətbiqin məzmununa, işləməsinə və istifadəçilərə təsirinə yalnız siz cavabdehsiniz.</li>
        <li>Məxfilik siyasəti hazırlamaq, istifadəçilərdən lazımi razılıqları almaq sizin öhdəliyinizdir.</li>
        <li>
          Google Play və digər mağazaların qaydalarına uyğunluq (məsələn, məxfilik siyasəti, məzmun
          qaydaları, imzalama) tamamilə sizin məsuliyyətinizdədir.
        </li>
        <li>Yüklədiyiniz fayllara və saytlara hüququnuzun olduğunu təsdiq edirsiniz.</li>
      </ul>

      <h2>3. Məsuliyyətdən imtina</h2>
      <p>
        Layihə və onun sahibi istifadəçilər tərəfindən yaradılan tətbiqlərə, onların məzmununa və
        ya istifadəsindən yaranan hər hansı zərərə, itkiyə və ya hüquqi nəticəyə görə məsuliyyət
        daşımır. Yaradılan tətbiqlərin istifadəsi tam olaraq sizin və tətbiqi yayan şəxsin risküdür.
      </p>

      <h2>4. “Olduğu kimi” təqdimat</h2>
      <p>
        Xidmət heç bir zəmanət olmadan “olduğu kimi” və “mövcud olduğu kimi” təqdim olunur: fasiləsiz
        işləmə, xətasızlıq, hər hansı məqsədə yararlılıq və ya fayllarınızın saxlanması barədə
        zəmanət verilmir. Xidmət istənilən vaxt dəyişdirilə və ya dayandırıla bilər.
      </p>

      <h2>5. Texniki qeydlər</h2>
      <ul>
        <li>
          Hazırlanan APK <strong>debug imzalıdır</strong> — test və birbaşa quraşdırma üçündür. AAB
          imzasızdır və Play Store üçün sonradan öz açarınızla imzalanmalıdır.
        </li>
        <li>Hazır fayllar qısa müddət (təxminən 7 gün) saxlanılır; vacib faylları yükləyib özünüz saxlayın.</li>
        <li>
          Məlumatların necə emal olunduğu <Link to="/privacy">məxfilik siyasətində</Link> izah
          olunub.
        </li>
      </ul>

      <h2>6. Əlaqə</h2>
      <p>
        Sual və ya şikayət üçün{" "}
        <a href={OWNER_SITE} target="_blank" rel="noopener noreferrer">
          nibrascode.com
        </a>{" "}
        vasitəsilə əlaqə saxlayın.
      </p>
    </LegalLayout>
  );
}
