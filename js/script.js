
(() => {
  "use strict";

  // ========= Helpers =========
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  document.documentElement.classList.add("js");

  // ========= Year =========
  const yearEl = $("#current-year") || $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ========= Scroll progress =========
  const progressBar = $("#scroll-progress-bar");
  const updateProgress = () => {
    if (!progressBar) return;
    const doc = document.documentElement;
    const scrollTop = window.scrollY || doc.scrollTop;
    const height = (doc.scrollHeight - doc.clientHeight) || 1;
    const pct = Math.max(0, Math.min(100, (scrollTop / height) * 100));
    progressBar.style.width = `${pct}%`;
  };
  window.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();

  // ========= Burger =========
  const burger = $("#burger");
  const nav = $("#main-nav");
  if (burger && nav) {
    const closeNav = () => {
      nav.classList.remove("open", "is-open");
      burger.setAttribute("aria-expanded", "false");
    };

    burger.addEventListener("click", () => {
      const isOpen = nav.classList.contains("open") || nav.classList.contains("is-open");
      if (isOpen) closeNav();
      else {
        nav.classList.add("open");
        burger.setAttribute("aria-expanded", "true");
      }
    });

    $$("#main-nav a").forEach((a) => {
      a.addEventListener("click", () => {
        if (window.matchMedia("(max-width: 760px)").matches) closeNav();
      });
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeNav();
    });
  }

  // ========= Reveal =========
  const revealEls = $$(".reveal, .reveal-soft");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => en.isIntersecting && en.target.classList.add("is-visible")),
      { threshold: 0.12 }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  // ========= Image Loader (IMAGES + logo) =========
  const logoSVG = encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">
      <defs>
        <radialGradient id="g" cx="40%" cy="30%" r="70%">
          <stop offset="0" stop-color="#ffffff" stop-opacity="0.92"/>
          <stop offset="0.55" stop-color="#00FF12" stop-opacity="0.22"/>
          <stop offset="1" stop-color="#00FF12" stop-opacity="0.04"/>
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="240" height="240" rx="52" fill="url(#g)"/>
      <path d="M58 74c28-22 62-32 102-20" stroke="#00FF12" stroke-opacity="0.70" stroke-width="10"
            stroke-linecap="round" fill="none"/>
      <text x="120" y="132" text-anchor="middle" font-family="Poppins, Arial" font-weight="700"
            font-size="22" fill="#111218" fill-opacity="0.92">My Passion</text>
      <text x="120" y="158" text-anchor="middle" font-family="Poppins, Arial" font-weight="600"
            font-size="14" fill="#111218" fill-opacity="0.56">Nails by M</text>
    </svg>
  `);
  const logoDataUri = `data:image/svg+xml;charset=utf-8,${logoSVG}`;

  const photoSVG = (title = "Photo") => {
    const svg = encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
        <defs>
          <radialGradient id="g" cx="20%" cy="10%" r="85%">
            <stop offset="0" stop-color="#ffffff" stop-opacity="0.95"/>
            <stop offset="0.55" stop-color="#00FF12" stop-opacity="0.10"/>
            <stop offset="1" stop-color="#ffffff" stop-opacity="0.90"/>
          </radialGradient>
        </defs>
        <rect x="0" y="0" width="1200" height="800" rx="56" fill="url(#g)"/>
        <rect x="90" y="90" width="1020" height="620" rx="44"
              fill="#ffffff" fill-opacity="0.70" stroke="#111218" stroke-opacity="0.10"/>
        <path d="M200 610 L460 410 L610 520 L820 360 L1020 610"
              fill="none" stroke="#00FF12" stroke-opacity="0.45" stroke-width="10" stroke-linejoin="round"/>
        <circle cx="410" cy="310" r="56" fill="#00FF12" fill-opacity="0.14"/>
        <text x="600" y="670" text-anchor="middle" font-family="Poppins, Arial" font-size="28"
              fill="#111218" fill-opacity="0.55">${title}</text>
      </svg>
    `);
    return `data:image/svg+xml;charset=utf-8,${svg}`;
  };

  // ✅ poprawka: szukamy też w katalogu głównym (./), bo ZIP który wysłałaś ma pliki bez folderu IMAGES
  const FOLDERS = [
    "./", // <-- DODANE
    "./IMAGES/", "./images/", "./Images/", "./img/", "./IMG/"
  ];

  const EXTS = [
    ".jpg", ".jpeg", ".png", ".webp",
    ".JPG", ".JPEG", ".PNG", ".WEBP",
    // warianty “podwójnych” rozszerzeń (bo takie masz w plikach)
    ".jpg.jpg", ".jpg.png", ".png.jpg", ".png.png",
    ".JPG.JPG", ".JPG.PNG", ".PNG.JPG", ".PNG.PNG"
  ];

  // ✅ poprawka: override może mieć kilka nazw – spróbujemy po kolei
  const IMAGE_OVERRIDES = {
    magdalena1: ["magdalena1.jpg.jpg", "magdalena1.jpg", "magdalena1.png"],
    magdalena2: ["magdalena2.jpg.jpg", "magdalena2.jpg", "magdalena2.png"],
    nails1: ["nails1.jpg.jpg", "nails1.jpg", "nails1.png"],
    nails2: ["nails2.jpg.jpg", "nails2.jpg", "nails2.png"],
    nails3: ["nails3.jpg.jpg", "nails3.jpg", "nails3.png"],
    nails5: ["nails5.jpg.jpg", "nails5.jpg", "nails5.png"],
    "logo-placeholder": ["logo-placeholder.png.jpg", "logo-placeholder.jpg.jpg", "logo-placeholder.png", "logo-placeholder.jpg"]
  };

  const loadFirstExisting = (candidates) =>
    new Promise((resolve) => {
      let i = 0;
      const tryNext = () => {
        if (i >= candidates.length) return resolve(null);
        const url = candidates[i++];
        const test = new Image();
        test.onload = () => resolve(url);
        test.onerror = () => tryNext();
        test.src = url;
      };
      tryNext();
    });

  const resolveCandidates = (key) => {
    // 1) jeżeli jest override — generujemy kandydatów w folderach
    if (IMAGE_OVERRIDES[key]) {
      const files = Array.isArray(IMAGE_OVERRIDES[key]) ? IMAGE_OVERRIDES[key] : [IMAGE_OVERRIDES[key]];
      const list = [];
      for (const f of FOLDERS) for (const file of files) list.push(f + file);
      return list;
    }

    // 2) jeżeli ktoś podał data-img z rozszerzeniem
    if (/\.(jpg|jpeg|png|webp)$/i.test(key)) return FOLDERS.map((f) => f + key);

    // 3) standard: folder + key + różne rozszerzenia
    const list = [];
    for (const folder of FOLDERS) for (const ext of EXTS) list.push(`${folder}${key}${ext}`);
    return list;
  };

  const applyImages = async () => {
    const imgs = $$("img[data-img]");
    for (const img of imgs) {
      const key = img.getAttribute("data-img");
      if (!key) continue;

      // logo
      if (key === "logo-placeholder") {
        const foundLogo = await loadFirstExisting(resolveCandidates("logo-placeholder"));
        img.src = foundLogo || logoDataUri;
        continue;
      }

      const found = await loadFirstExisting(resolveCandidates(key));
      img.src = found || photoSVG(key);
    }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", applyImages);
  else applyImages();

  // ========= I18N (AUTO + SWITCHER, FULL) =========
  const langSelect = $("#language-switcher");

  // 1) zapisujemy oryginalne teksty (PL) jako fallback
  const cacheOriginalTexts = () => {
    $$("[data-i18n]").forEach((el) => {
      if (!el.dataset.i18nPl) el.dataset.i18nPl = (el.textContent || "").trim();
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        if (!el.dataset.phPl) el.dataset.phPl = el.placeholder || "";
      }
    });
  };
  cacheOriginalTexts();

  const dictionaries = {
    pl: {
      brandName: "My Passion Nails by M",
      brandNameFooter: "My Passion Nails by M",
      langLabel: "Wybierz język",

      navAbout: "O mnie",
      navServices: "Oferta",
      navBooking: "Rezerwacja",
      navGallery: "Galeria",
      navShop: "Sklep",
      navContact: "Kontakt",
      navBookNow: "Umów wizytę",

      heroKicker: "Salon stylizacji paznokci",
      heroTitle: "My Passion Nails by M",
      heroSubtitle: "Twoje paznokcie – Twój styl.",
      heroSubtext: "Eleganckie, dopracowane stylizacje i spokojna atmosfera. Zadbane dłonie, które pasują do Ciebie.",
      heroCtaPrimary: "Umów wizytę online",
      heroCtaSecondary: "Nie ma terminu? Napisz",
      heroMicro1: "Spokojna atmosfera",
      heroMicro2: "Indywidualne podejście",
      heroMicro3: "Perfekcyjny detal",
      heroName: "Magdalena",
      heroRole: "Stylistka paznokci",
      heroNote: "Spokojna atmosfera, indywidualne podejście i stylizacje dopasowane do Twojego stylu życia.",
      heroQuickBook: "Szybka rezerwacja",

      aboutTitle: "O mnie",
      aboutLead:
        "Nazywam się Magdalena i jestem stylistką paznokci. Tworzę miejsce, w którym każda osoba może poczuć się piękna i zaopiekowana.",
      aboutBody1:
        "Kiedy byłam małą dziewczynką, moje życie diametralnie się zmieniło. W wyniku wypadku straciłam palec — i choć fizycznie się zagoiłam, emocjonalnie zostałam z tym doświadczeniem na wiele lat. Czułam się inna, niepewna i niewystarczająca.",
      aboutBody2:
        "Podczas wizyt w salonach kosmetycznych często spotykałam się z odmową lub nieprzyjemnymi komentarzami. Te sytuacje były bolesne. Z czasem jednak przerodziły się w siłę i determinację — postanowiłam stworzyć miejsce bez oceniania i odrzucenia. Tak narodziła się moja pasja.",
      aboutBody3:
        "Choć z wykształcenia jestem socjologiem, życie poprowadziło mnie inną drogą. Przeprowadzka za granicę była wyzwaniem — nowy język, kultura i praca daleka od moich zainteresowań. Mimo to nie przestałam rozwijać umiejętności w stylizacji paznokci.",
      aboutBody4:
        "Z czasem pojawiły się sukcesy: zostałam instruktorem stylizacji paznokci, publikowałam artykuły branżowe i zdobyłam tytuły na mistrzostwach stylizacji. To utwierdziło mnie w przekonaniu, że wybrałam właściwą drogę.",
      aboutBody5:
        "Dziś wspieram osoby, które chcą się rozwijać i wracać do swojej pasji — także te, które czują wypalenie. Moją misją jest inspirowanie i dawanie realnych narzędzi do działania.",
      aboutBody6:
        "Jeśli czujesz, że potrzebujesz wsparcia, wskazówek lub inspiracji – jestem tu, aby Ci pomóc!",
      aboutBookingBtn: "Umów wizytę online",
      aboutContactBtn: "Napisz do mnie",

      servicesTitle: "Oferta / Zabiegi",
      servicesLead: "Poniżej znajdziesz główne zabiegi dostępne w moim studio.",

      serviceBasicTitle: "Manicure klasyczny",
      serviceBasicDesc: "Delikatne opracowanie paznokci i skórek, nadanie kształtu oraz pielęgnacja dłoni.",
      serviceHybridTitle: "Manicure hybrydowy (shellac)",
      serviceHybridDesc: "Trwały manicure hybrydowy, który pozostaje estetyczny przez wiele dni.",
      serviceHybridCuticlesTitle: "Manicure hybrydowy z opracowaniem skórek",
      serviceHybridCuticlesDesc: "Dokładne opracowanie skórek + stylizacja hybrydowa — dla maksymalnie zadbanego efektu.",
      serviceGelNaturalTitle: "Aplikacja żelu na naturalną płytkę",
      serviceGelNaturalDesc: "Wzmocnienie naturalnej płytki żelem, bez przedłużania. Naturalny, elegancki efekt.",
      serviceGelCorrectionTitle: "Korekta paznokci żelowych",
      serviceGelCorrectionDesc: "Uzupełnienie stylizacji żelowej — wyrównanie odrostu i dopracowanie kształtu.",
      serviceSubscriptionTitle: "Abonament na manicure",
      serviceSubscriptionDesc: "Pakiet wizyt w korzystnej cenie — stała pielęgnacja i pewność terminów.",
      serviceNailArtTitle: "Nail Art / Zdobienia",
      serviceNailArtDesc:
        "Wykonuję również zdobienia. Proszę, daj znać podczas rezerwacji, że interesuje Cię nail art – czas wizyty może się wydłużyć.",

      bookingTitle: "Rezerwacja online",
      bookingLead: "Wybierz dogodny termin bez telefonowania – kilka kliknięć i gotowe.",
      bookingBody: "Reservio pozwala sprawdzić dostępne godziny, wybrać zabieg i szybko potwierdzić wizytę. Wygodnie i 24/7.",
      bookingCta: "Zarezerwuj wizytę",
      bookingAltText: "Nie widzisz dla siebie terminu? Napisz do mnie – wspólnie znajdziemy rozwiązanie.",
      bookingAltCta: "Przejdź do formularza",

      galleryTitle: "Galeria",
      galleryLead: "Przykładowe stylizacje wykonane w My Passion Nails by M.",

      shopTitle: "Sklep – szkolenia online",
      shopLead: "Wkrótce uruchomię sklep z moimi szkoleniami online (głównie po polsku, a docelowo również po francusku).",
      shopPlaceholder:
        "Sekcja w przygotowaniu. Po uruchomieniu sklepu kursantki otrzymają dostęp do własnego panelu, gdzie po zakupie będą mogły się zalogować i przejść cały kurs online.",
      shopPanelTag: "Panel kursanta – wkrótce",
      shopPanelDesc: "Konto z dostępem do lekcji wideo, materiałów PDF i aktualizacji.",

      contactTitle: "Kontakt / Social Media",
      contactLead: "Masz pytania lub nie widzisz terminu? Napisz do mnie – odpowiem najszybciej, jak to możliwe.",
      contactAddressLabel: "Adres:",
      contactAddress: "Joseph Possozplein 9, 1500 Halle",
      contactDirectionsBtn: "Trasa dojazdu",
      contactBookBtn: "Umów wizytę",

      contactFormTitle: "Napisz wiadomość",
      contactFormIntro: "Jeśli nie znalazłaś/eś terminu w rezerwacji online lub masz pytanie — wypełnij formularz.",
      contactFormName: "Imię i nazwisko",
      contactFormEmail: "Adres e-mail",
      contactFormPhone: "Numer telefonu (opcjonalnie)",
      contactFormTopic: "Temat",
      contactFormTopicVisit: "Brak wolnego terminu",
      contactFormTopicNailArt: "Nail art / zdobienia",
      contactFormTopicCourse: "Szkolenia / kursy online",
      contactFormTopicOther: "Inne",
      contactFormMessage: "Wiadomość",
      contactFormConsent: "Zapoznałam/em się z polityką prywatności i wyrażam zgodę na kontakt w odpowiedzi na wiadomość.",
      contactFormSubmit: "Wyślij wiadomość",
      contactFormSuccess: "Gotowe — otworzyłam/em Twoją pocztę. Kliknij “Wyślij” w mailu i gotowe.",

      // ✅ DODANE — tylko tłumaczenie przycisku do Google Forms
      contactFormButton: "Otwórz formularz kontaktowy",

      footerRights: "Wszelkie prawa zastrzeżone.",
      footerPrivacy: "Polityka prywatności",
      footerTerms: "Regulamin",
      footerCookies: "Cookies",

      cookiesBannerText: "Ta strona wykorzystuje pliki cookie, aby poprawić komfort korzystania. Kontynuując, akceptujesz ich użycie.",
      cookiesBannerAccept: "Akceptuję"
    },

    fr: {
      brandName: "My Passion Nails by M",
      brandNameFooter: "My Passion Nails by M",
      langLabel: "Choisir la langue",

      navAbout: "À propos",
      navServices: "Prestations",
      navBooking: "Réservation",
      navGallery: "Galerie",
      navShop: "Boutique",
      navContact: "Contact",
      navBookNow: "Prendre RDV",

      heroKicker: "Studio de stylisme d’ongles",
      heroTitle: "My Passion Nails by M",
      heroSubtitle: "Tes ongles — ton style.",
      heroSubtext: "Des prestations élégantes, soignées et une atmosphère apaisante. Des mains impeccables, adaptées à toi.",
      heroCtaPrimary: "Réserver en ligne",
      heroCtaSecondary: "Pas de créneau ? Écris-moi",
      heroMicro1: "Ambiance calme",
      heroMicro2: "Approche personnalisée",
      heroMicro3: "Détails parfaits",
      heroName: "Magdalena",
      heroRole: "Styliste ongulaire",
      heroNote: "Un espace apaisant, une approche individuelle et des looks adaptés à ton style de vie.",
      heroQuickBook: "Réservation rapide",

      aboutTitle: "À propos de moi",
      aboutLead:
        "Je m’appelle Magdalena et je suis styliste ongulaire. Je crée un lieu où chaque personne peut se sentir belle, respectée et prise en charge.",
      aboutBody1:
        "Quand j’étais petite, ma vie a profondément changé. À la suite d’un accident, j’ai perdu un doigt — et même si mon corps a guéri, cette expérience m’a marquée émotionnellement pendant des années. Je me sentais différente, fragile et insuffisante.",
      aboutBody2:
        "Lors de certaines visites en institut, j’ai parfois subi des refus ou des remarques déplacées. C’était douloureux. Avec le temps, cette douleur est devenue une force : j’ai décidé de créer un endroit sans jugement ni exclusion. C’est ainsi que ma passion est née.",
      aboutBody3:
        "Même si je suis sociologue de formation, la vie m’a menée ailleurs. M’installer à l’étranger a été un défi : nouvelle langue, nouvelle culture et des emplois éloignés de ce qui me faisait vibrer. Malgré tout, je n’ai jamais cessé de perfectionner mes compétences en stylisme ongulaire.",
      aboutBody4:
        "Puis les premiers succès sont arrivés : je suis devenue formatrice, j’ai publié des articles spécialisés et j’ai obtenu des titres lors de championnats de stylisme ongulaire. Cela m’a confirmé que j’avais choisi la bonne voie.",
      aboutBody5:
        "Aujourd’hui, j’accompagne celles et ceux qui veulent se développer et retrouver leur passion — y compris les personnes qui traversent un épuisement. Ma mission est d’inspirer et de donner des outils concrets pour avancer.",
      aboutBody6:
        "Si tu as besoin de soutien, de conseils ou d’inspiration — je suis là pour t’aider !",
      aboutBookingBtn: "Réserver en ligne",
      aboutContactBtn: "Me contacter",

      servicesTitle: "Prestations",
      servicesLead: "Voici les principales prestations disponibles dans mon studio.",

      serviceBasicTitle: "Manucure classique",
      serviceBasicDesc: "Mise en forme douce des ongles et des cuticules, plus soin des mains.",
      serviceHybridTitle: "Semi-permanent (shellac)",
      serviceHybridDesc: "Une pose durable qui reste esthétique pendant plusieurs jours.",
      serviceHybridCuticlesTitle: "Semi-permanent avec travail des cuticules",
      serviceHybridCuticlesDesc: "Cuticules travaillées + semi-permanent, pour un résultat impeccable.",
      serviceGelNaturalTitle: "Gel sur ongle naturel",
      serviceGelNaturalDesc: "Renforcement au gel sans rallongement. Effet naturel et élégant.",
      serviceGelCorrectionTitle: "Remplissage gel",
      serviceGelCorrectionDesc: "Comblement de la repousse et perfectionnement de la forme.",
      serviceSubscriptionTitle: "Abonnement manucure",
      serviceSubscriptionDesc: "Pack de visites à prix avantageux — régularité et créneaux assurés.",
      serviceNailArtTitle: "Nail art / décorations",
      serviceNailArtDesc:
        "Je réalise aussi des décorations. Merci de le préciser lors de la réservation — la durée peut être prolongée.",

      bookingTitle: "Réservation en ligne",
      bookingLead: "Choisis un horaire sans appeler — quelques clics et c’est fait.",
      bookingBody: "Reservio te permet de vérifier les disponibilités, choisir la prestation et confirmer rapidement. 24/7.",
      bookingCta: "Réserver un rendez-vous",
      bookingAltText: "Aucun créneau qui te convient ? Écris-moi — on trouvera une solution.",
      bookingAltCta: "Aller au formulaire",

      galleryTitle: "Galerie",
      galleryLead: "Exemples de réalisations My Passion Nails by M.",

      shopTitle: "Boutique — formations en ligne",
      shopLead: "Bientôt : boutique de formations (principalement en polonais, puis aussi en français).",
      shopPlaceholder:
        "Section en préparation. Après l’ouverture, les élèves auront un espace personnel : connexion après achat et accès au contenu du cours.",
      shopPanelTag: "Espace élève — bientôt",
      shopPanelDesc: "Compte avec vidéos, supports PDF et mises à jour.",

      contactTitle: "Contact / Réseaux sociaux",
      contactLead: "Une question ou aucun créneau ? Écris-moi — je répondrai dès que possible.",
      contactAddressLabel: "Adresse :",
      contactAddress: "Joseph Possozplein 9, 1500 Halle",
      contactDirectionsBtn: "Itinéraire",
      contactBookBtn: "Prendre RDV",

      contactFormTitle: "Envoyer un message",
      contactFormIntro: "Si aucun créneau ne te convient ou si tu as une question — remplis le formulaire.",
      contactFormName: "Nom et prénom",
      contactFormEmail: "Adresse e-mail",
      contactFormPhone: "Téléphone (optionnel)",
      contactFormTopic: "Sujet",
      contactFormTopicVisit: "Aucun créneau disponible",
      contactFormTopicNailArt: "Nail art / décorations",
      contactFormTopicCourse: "Formations / cours en ligne",
      contactFormTopicOther: "Autre",
      contactFormMessage: "Message",
      contactFormConsent: "J’ai lu la politique de confidentialité et j’accepte d’être contacté(e) en réponse à mon message.",
      contactFormSubmit: "Envoyer",
      contactFormSuccess: "C’est prêt — ton application e-mail s’est ouverte. Clique sur « Envoyer » et c’est bon.",

      // ✅ DODANE — tylko tłumaczenie przycisku do Google Forms
      contactFormButton: "Ouvrir le formulaire de contact",

      footerRights: "Tous droits réservés.",
      footerPrivacy: "Politique de confidentialité",
      footerTerms: "Conditions / Règlement",
      footerCookies: "Cookies",

      cookiesBannerText: "Ce site utilise des cookies pour améliorer votre expérience. En continuant, vous acceptez leur utilisation.",
      cookiesBannerAccept: "J’accepte"
    },

    en: {
      brandName: "My Passion Nails by M",
      brandNameFooter: "My Passion Nails by M",
      langLabel: "Choose language",

      navAbout: "About",
      navServices: "Services",
      navBooking: "Booking",
      navGallery: "Gallery",
      navShop: "Shop",
      navContact: "Contact",
      navBookNow: "Book now",

      heroKicker: "Nail studio",
      heroTitle: "My Passion Nails by M",
      heroSubtitle: "Your nails — your style.",
      heroSubtext: "Elegant, detailed work in a calm atmosphere. Beautiful hands that truly fit you.",
      heroCtaPrimary: "Book online",
      heroCtaSecondary: "No slot? Message me",
      heroMicro1: "Calm atmosphere",
      heroMicro2: "Personal approach",
      heroMicro3: "Perfect detail",
      heroName: "Magdalena",
      heroRole: "Nail stylist",
      heroNote: "A calm space, individual approach, and nail looks tailored to your lifestyle.",
      heroQuickBook: "Quick booking",

      aboutTitle: "About me",
      aboutLead:
        "My name is Magdalena and I’m a nail stylist. I create a place where everyone can feel beautiful, respected, and cared for.",
      aboutBody1:
        "When I was a little girl, my life changed dramatically. After an accident, I lost a finger — and even though I healed physically, emotionally it stayed with me for years. I often felt different, insecure, and not enough.",
      aboutBody2:
        "During some salon visits, I faced refusals or unpleasant comments. Those moments were painful. Over time, they turned into strength and determination — I decided to build a space with no judgment or exclusion. That’s how my passion was born.",
      aboutBody3:
        "Although I’m a sociologist by education, life led me in another direction. Moving abroad was challenging — a new language, a new culture, and jobs far from what I truly loved. Still, I kept improving my skills in nail styling.",
      aboutBody4:
        "Then came the first successes: I became an instructor, published industry articles, and earned titles in nail styling championships. That was a turning point that confirmed I was on the right path.",
      aboutBody5:
        "Today I support people who want to grow and return to their passion — including those experiencing burnout. My mission is to inspire and provide practical tools that really help.",
      aboutBody6:
        "If you feel you need support, guidance, or inspiration — I’m here to help!",
      aboutBookingBtn: "Book online",
      aboutContactBtn: "Message me",

      servicesTitle: "Services",
      servicesLead: "Below are the main services available in my studio.",

      serviceBasicTitle: "Classic manicure",
      serviceBasicDesc: "Gentle nail & cuticle work, shaping, and hand care.",
      serviceHybridTitle: "Gel polish (shellac)",
      serviceHybridDesc: "Long-lasting gel polish that stays beautiful for days.",
      serviceHybridCuticlesTitle: "Gel polish with cuticle work",
      serviceHybridCuticlesDesc: "Detailed cuticle work + gel polish for a perfectly neat finish.",
      serviceGelNaturalTitle: "Gel on natural nails",
      serviceGelNaturalDesc: "Strengthening with gel without extensions. Natural, elegant result.",
      serviceGelCorrectionTitle: "Gel refill",
      serviceGelCorrectionDesc: "Fill-in, rebalance and refine the shape.",
      serviceSubscriptionTitle: "Manicure subscription",
      serviceSubscriptionDesc: "A package of visits at a better price — consistent care and secured slots.",
      serviceNailArtTitle: "Nail art / decorations",
      serviceNailArtDesc: "I also do nail art. Please mention it when booking — the appointment may take longer.",

      bookingTitle: "Online booking",
      bookingLead: "Choose a time without calling — a few clicks and you’re done.",
      bookingBody: "Reservio lets you check availability, pick a service and confirm quickly. 24/7.",
      bookingCta: "Book an appointment",
      bookingAltText: "Can’t find a suitable slot? Message me — we’ll find a solution.",
      bookingAltCta: "Go to the form",

      galleryTitle: "Gallery",
      galleryLead: "Sample designs from My Passion Nails by M.",

      shopTitle: "Shop — online trainings",
      shopLead: "Coming soon: a shop with my online trainings (mainly in Polish, later also in French).",
      shopPlaceholder:
        "Section in progress. After launch, students will have their own panel: login after purchase and access to the full course.",
      shopPanelTag: "Student panel — soon",
      shopPanelDesc: "Account with videos, PDFs and updates.",

      contactTitle: "Contact / Social Media",
      contactLead: "Questions or no slots available? Message me — I’ll reply as soon as possible.",
      contactAddressLabel: "Address:",
      contactAddress: "Joseph Possozplein 9, 1500 Halle",
      contactDirectionsBtn: "Directions",
      contactBookBtn: "Book now",

      contactFormTitle: "Send a message",
      contactFormIntro: "If you can’t find a slot online or have a question — fill in the form.",
      contactFormName: "Full name",
      contactFormEmail: "Email address",
      contactFormPhone: "Phone (optional)",
      contactFormTopic: "Topic",
      contactFormTopicVisit: "No available slot",
      contactFormTopicNailArt: "Nail art / decorations",
      contactFormTopicCourse: "Trainings / online courses",
      contactFormTopicOther: "Other",
      contactFormMessage: "Message",
      contactFormConsent: "I have read the privacy policy and consent to being contacted in response to my message.",
      contactFormSubmit: "Send message",
      contactFormSuccess: "Done — your email app opened. Click “Send” in the email and you’re all set.",

      // ✅ DODANE — tylko tłumaczenie przycisku do Google Forms
      contactFormButton: "Open contact form",

      footerRights: "All rights reserved.",
      footerPrivacy: "Privacy policy",
      footerTerms: "Terms",
      footerCookies: "Cookies",

      cookiesBannerText: "This website uses cookies to improve your experience. By continuing, you accept their use.",
      cookiesBannerAccept: "Accept"
    },

    nl: {
      brandName: "My Passion Nails by M",
      brandNameFooter: "My Passion Nails by M",
      langLabel: "Kies taal",

      navAbout: "Over mij",
      navServices: "Diensten",
      navBooking: "Reserveren",
      navGallery: "Galerij",
      navShop: "Shop",
      navContact: "Contact",
      navBookNow: "Boek nu",

      heroKicker: "Nagelstudio",
      heroTitle: "My Passion Nails by M",
      heroSubtitle: "Jouw nagels — jouw stijl.",
      heroSubtext: "Elegante, verfijnde resultaten in een rustige sfeer. Verzorgde handen die bij jou passen.",
      heroCtaPrimary: "Online boeken",
      heroCtaSecondary: "Geen plek? Stuur bericht",
      heroMicro1: "Rustige sfeer",
      heroMicro2: "Persoonlijke aanpak",
      heroMicro3: "Perfect detail",
      heroName: "Magdalena",
      heroRole: "Nagelstyliste",
      heroNote: "Rustige sfeer, persoonlijke aanpak en styling passend bij jouw levensstijl.",
      heroQuickBook: "Snel boeken",

      aboutTitle: "Over mij",
      aboutLead:
        "Ik ben Magdalena en ik ben nagelstyliste. Ik creëer een plek waar iedereen zich mooi, gerespecteerd en goed verzorgd kan voelen.",
      aboutBody1:
        "Toen ik klein was, veranderde mijn leven ingrijpend. Door een ongeluk verloor ik een vinger — en hoewel ik lichamelijk herstelde, bleef het emotioneel jarenlang aanwezig. Ik voelde me vaak anders, onzeker en niet goed genoeg.",
      aboutBody2:
        "Tijdens sommige salonbezoeken kreeg ik te maken met afwijzingen of nare opmerkingen. Dat deed pijn. Na verloop van tijd werd die pijn kracht en vastberadenheid: ik besloot een plek te creëren zonder oordeel of uitsluiting. Zo ontstond mijn passie.",
      aboutBody3:
        "Hoewel ik sociologie heb gestudeerd, bracht het leven me een andere kant op. Verhuizen naar het buitenland was uitdagend — een nieuwe taal, cultuur en banen die ver van mijn echte interesses lagen. Toch bleef ik mijn vaardigheden in nagelstyling ontwikkelen.",
      aboutBody4:
        "Daarna kwamen successen: ik werd instructeur, publiceerde vakartikelen en behaalde titels op nagelstylingkampioenschappen. Dat bevestigde voor mij dat ik de juiste weg was ingeslagen.",
      aboutBody5:
        "Vandaag ondersteun ik mensen die willen groeien en terug willen keren naar hun passie — ook wie een burn-out ervaart. Mijn missie is inspireren en praktische tools geven die echt helpen.",
      aboutBody6:
        "Heb je steun, tips of inspiratie nodig? Ik ben er om je te helpen!",
      aboutBookingBtn: "Online boeken",
      aboutContactBtn: "Stuur bericht",

      servicesTitle: "Diensten",
      servicesLead: "Hieronder vind je de belangrijkste behandelingen in mijn studio.",

      serviceBasicTitle: "Klassieke manicure",
      serviceBasicDesc: "Zachte verzorging van nagels en nagelriemen, vorm en handverzorging.",
      serviceHybridTitle: "Gellak (shellac)",
      serviceHybridDesc: "Duurzame gellak die dagenlang mooi blijft.",
      serviceHybridCuticlesTitle: "Gellak met nagelriemverzorging",
      serviceHybridCuticlesDesc: "Grondige nagelriemverzorging + gellak voor een extra strak resultaat.",
      serviceGelNaturalTitle: "Gel op natuurlijke nagel",
      serviceGelNaturalDesc: "Versteviging met gel zonder verlengen. Natuurlijk en elegant.",
      serviceGelCorrectionTitle: "Gel bijwerken",
      serviceGelCorrectionDesc: "Opvullen van uitgroei en verfijning van de vorm.",
      serviceSubscriptionTitle: "Manicure-abonnement",
      serviceSubscriptionDesc: "Voordelig pakket — vaste verzorging en zekerheid van afspraken.",
      serviceNailArtTitle: "Nail art / versieringen",
      serviceNailArtDesc: "Ik doe ook nail art. Laat het weten bij de reservering — de afspraak kan langer duren.",

      bookingTitle: "Online reserveren",
      bookingLead: "Kies een tijd zonder te bellen — een paar klikken en klaar.",
      bookingBody: "Met Reservio kun je beschikbaarheid bekijken, een behandeling kiezen en snel bevestigen. 24/7.",
      bookingCta: "Afspraak boeken",
      bookingAltText: "Geen geschikte tijd? Stuur me een bericht — we vinden een oplossing.",
      bookingAltCta: "Naar het formulier",

      galleryTitle: "Galerij",
      galleryLead: "Voorbeelden van designs van My Passion Nails by M.",

      shopTitle: "Shop — online trainingen",
      shopLead: "Binnenkort: shop met online trainingen (vooral Pools, later ook Frans).",
      shopPlaceholder:
        "Sectie in voorbereiding. Na de lancering krijgen cursisten een eigen panel: inloggen na aankoop en toegang tot de volledige cursus.",
      shopPanelTag: "Cursistenpanel — binnenkort",
      shopPanelDesc: "Account met video’s, PDF’s en updates.",

      contactTitle: "Contact / Social media",
      contactLead: "Vragen of geen plek? Stuur me een bericht — ik antwoord zo snel mogelijk.",
      contactAddressLabel: "Adres:",
      contactAddress: "Joseph Possozplein 9, 1500 Halle",
      contactDirectionsBtn: "Route",
      contactBookBtn: "Boek nu",

      contactFormTitle: "Stuur een bericht",
      contactFormIntro: "Als je geen geschikte tijd vindt of een vraag hebt — vul het formulier in.",
      contactFormName: "Naam en achternaam",
      contactFormEmail: "E-mailadres",
      contactFormPhone: "Telefoon (optioneel)",
      contactFormTopic: "Onderwerp",
      contactFormTopicVisit: "Geen beschikbare tijd",
      contactFormTopicNailArt: "Nail art / versieringen",
      contactFormTopicCourse: "Trainingen / online cursussen",
      contactFormTopicOther: "Anders",
      contactFormMessage: "Bericht",
      contactFormConsent: "Ik heb het privacybeleid gelezen en ga akkoord dat er contact wordt opgenomen als antwoord op mijn bericht.",
      contactFormSubmit: "Versturen",
      contactFormSuccess: "Klaar — je e-mailapp is geopend. Klik op ‘Verzenden’ en klaar.",

      // ✅ DODANE — tylko tłumaczenie przycisku do Google Forms
      contactFormButton: "Open het contactformulier",

      footerRights: "Alle rechten voorbehouden.",
      footerPrivacy: "Privacybeleid",
      footerTerms: "Voorwaarden",
      footerCookies: "Cookies",

      cookiesBannerText: "Deze website gebruikt cookies om je ervaring te verbeteren. Door verder te gaan ga je akkoord met het gebruik.",
      cookiesBannerAccept: "Akkoord"
    }
  };

  const normalizeLang = (lang) => {
    const l = (lang || "").toLowerCase();
    if (l.startsWith("fr")) return "fr";
    if (l.startsWith("nl")) return "nl";
    if (l.startsWith("en")) return "en";
    return "pl";
  };

  const detectLanguage = () => {
    const saved = localStorage.getItem("siteLang");
    if (saved && dictionaries[saved]) return saved;

    const navLang = normalizeLang(navigator.language || navigator.userLanguage || "pl");
    return dictionaries[navLang] ? navLang : "pl";
  };

  let activeLang = detectLanguage();

  const applyI18n = (lang) => {
    activeLang = lang;
    const dict = dictionaries[lang] || dictionaries.pl;

    document.documentElement.lang = lang;

    $$("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (!key) return;

      const val = dict[key];
      if (typeof val === "string" && val.length) {
        el.textContent = val;
      } else {
        if (el.dataset.i18nPl) el.textContent = el.dataset.i18nPl;
      }
    });

    // placeholder “Opcjonalnie” w telefonie
    const phone = $("#cf-phone");
    if (phone) {
      const phMap = { pl: "Opcjonalnie", fr: "Optionnel", en: "Optional", nl: "Optioneel" };
      phone.placeholder = phMap[lang] || phMap.pl;
    }

    // ✅ DODANE — TYLKO tłumaczenie przycisku/linku do Google Forms (bez zmiany HTML)
    // Szukamy linku w sekcji #contact, który prowadzi do docs.google.com/forms
    const googleFormBtn = document.querySelector('#contact a[href*="docs.google.com/forms"]');
    if (googleFormBtn) {
      googleFormBtn.textContent = dict.contactFormButton || "Otwórz formularz kontaktowy";
    }
  };

  if (langSelect) langSelect.value = activeLang;
  applyI18n(activeLang);

  if (langSelect) {
    langSelect.addEventListener("change", () => {
      const lang = langSelect.value;
      localStorage.setItem("siteLang", lang);
      applyI18n(lang);
    });
  }

  // ========= Cookies banner =========
  const cookieBanner = $("#cookie-banner");
  const cookieAccept = $("#cookie-accept");
  const COOKIE_KEY = "cookieAccepted";

  const hideCookieBanner = () => {
    if (!cookieBanner) return;
    cookieBanner.style.display = "none";
  };

  if (cookieBanner) {
    const already = localStorage.getItem(COOKIE_KEY) === "1";
    if (already) hideCookieBanner();
  }
  if (cookieAccept) {
    cookieAccept.addEventListener("click", () => {
      localStorage.setItem(COOKIE_KEY, "1");
      hideCookieBanner();
    });
  }

  // ========= Legal modal (PL formal + FR) =========
  const modal = $("#legal-modal");
  const modalBackdrop = $("#modal-backdrop");
  const modalClose = $("#modal-close");
  const modalTitle = $("#modal-title");
  const modalBody = $("#modal-body");

  const lockScroll = (locked) => {
    document.body.style.overflow = locked ? "hidden" : "";
  };

  const openModal = () => {
    if (!modal) return;
    modal.setAttribute("aria-hidden", "false");
    lockScroll(true);
  };

  const closeModal = () => {
    if (!modal) return;
    modal.setAttribute("aria-hidden", "true");
    delete modal.dataset.activeLegal;
    lockScroll(false);
  };

  const legalTitles = {
    pl: { privacy: "Polityka prywatności", terms: "Regulamin", cookies: "Polityka cookies" },
    fr: { privacy: "Politique de confidentialité", terms: "Conditions / Règlement", cookies: "Politique de cookies" }
  };

  const legalTexts = {
    pl: {
      privacy: `
        <h4>1. Administrator danych</h4>
        <p>1. Administratorem danych osobowych jest <strong>My Passion Nails by M</strong> (działalność jednoosobowa w Belgii – przedsiębiorca indywidualny), adres: <strong>Joseph Possozplein 9, 1500 Halle</strong>, e-mail: <a href="mailto:mypassionnailsbym@gmail.com">mypassionnailsbym@gmail.com</a>.</p>
        <p>2. Numer przedsiębiorstwa (enterprise number): <strong>800.748.163</strong>.</p>

        <h4>2. Zakres przetwarzanych danych</h4>
        <p>1. W związku z korzystaniem ze strony internetowej oraz kontaktem z Administratorem, przetwarzane mogą być następujące dane osobowe: <strong>imię i nazwisko</strong>, <strong>adres e-mail</strong>, a także – jeżeli zostały podane – <strong>numer telefonu</strong>, <strong>temat oraz treść wiadomości</strong>.</p>
        <p>2. Zakres przetwarzania danych jest każdorazowo uzależniony od treści przekazanych przez osobę kontaktującą się z Administratorem oraz od wybranego kanału kontaktu.</p>

        <h4>3. Cele i podstawy prawne przetwarzania</h4>
        <p>Dane osobowe mogą być przetwarzane w następujących celach oraz na następujących podstawach prawnych:</p>
        <ul>
          <li><strong>udzielenie odpowiedzi na zapytanie oraz prowadzenie korespondencji</strong> – na podstawie art. 6 ust. 1 lit. b RODO (działania przed zawarciem umowy) i/lub art. 6 ust. 1 lit. f RODO (prawnie uzasadniony interes Administratora polegający na obsłudze korespondencji),</li>
          <li><strong>obsługa zapytań dotyczących dostępności terminów oraz organizacji wizyt</strong> – na podstawie art. 6 ust. 1 lit. b RODO,</li>
          <li><strong>ustalenie, dochodzenie lub obrona roszczeń</strong> – na podstawie art. 6 ust. 1 lit. f RODO (prawnie uzasadniony interes Administratora polegający na ochronie jego praw).</li>
        </ul>

        <h4>4. Rezerwacje online (Reservio)</h4>
        <p>1. Rezerwacja wizyt może odbywać się za pośrednictwem zewnętrznego serwisu <strong>Reservio</strong>.</p>
        <p>2. W zakresie danych przekazywanych w procesie rezerwacji za pośrednictwem Reservio, podmiot ten może przetwarzać dane zgodnie z własnymi warunkami oraz dokumentami (w szczególności polityką prywatności i regulaminem).</p>
        <p>3. Administrator może otrzymywać dane związane z rezerwacją w zakresie niezbędnym do realizacji usługi oraz kontaktu z Klientem.</p>

        <h4>5. Informacje dotyczące płatności</h4>
        <p>1. W ramach prowadzonej działalności mogą być dostępne następujące metody płatności: <strong>płatność kartą</strong>, <strong>przelew bankowy</strong>, <strong>płatność gotówką</strong> oraz <strong>płatność mobilna/QR</strong> (np. kod QR generowany przez bank).</p>
        <p>2. Informacja o dostępności konkretnej metody płatności może zostać przekazana na etapie rezerwacji wizyty lub przed jej realizacją.</p>
        <p>3. Działalność jest zarejestrowanym podatnikiem VAT, jednak korzysta ze zwolnienia z naliczania i odliczania podatku VAT zgodnie z obowiązującymi przepisami prawa podatkowego w Belgii.</p>

        <h4>6. Okres przechowywania danych</h4>
        <p>1. Dane przetwarzane w związku z korespondencją przechowywane są przez okres niezbędny do udzielenia odpowiedzi oraz prowadzenia komunikacji.</p>
        <p>2. Dane mogą być przechowywane również przez okres niezbędny do zabezpieczenia ewentualnych roszczeń, co do zasady <strong>nie dłużej niż 12 miesięcy</strong>, chyba że obowiązujące przepisy prawa wymagają dłuższego okresu przechowywania lub dłuższy okres jest uzasadniony charakterem sprawy.</p>

        <h4>7. Odbiorcy danych</h4>
        <p>1. Dane osobowe mogą być przekazywane podmiotom świadczącym na rzecz Administratora usługi o charakterze technicznym i organizacyjnym (np. usługi IT, hosting poczty elektronicznej).</p>
        <p>2. Dane mogą być także przekazywane do <strong>Reservio</strong> w zakresie związanym z obsługą rezerwacji.</p>
        <p>3. Dane osobowe <strong>nie są sprzedawane</strong> ani udostępniane podmiotom trzecim w celach marketingowych Administratora.</p>

        <h4>8. Prawa osoby, której dane dotyczą</h4>
        <p>Osobie, której dane dotyczą, przysługują prawa wynikające z RODO, w szczególności: prawo dostępu do danych, prawo sprostowania danych, prawo usunięcia danych (w przypadkach przewidzianych przepisami), prawo ograniczenia przetwarzania, prawo przenoszenia danych (w zakresie, w jakim przysługuje), prawo wniesienia sprzeciwu wobec przetwarzania opartego na art. 6 ust. 1 lit. f RODO. Ponadto przysługuje prawo wniesienia skargi do właściwego organu nadzorczego w Belgii.</p>

        <h4>9. Kontakt w sprawach związanych z ochroną danych</h4>
        <p>W sprawach związanych z ochroną danych osobowych oraz realizacją praw, o których mowa powyżej, kontakt z Administratorem jest możliwy pod adresem e-mail: <a href="mailto:mypassionnailsbym@gmail.com">mypassionnailsbym@gmail.com</a>.</p>
      `,
      terms: `
        <h4>1. Informacje ogólne</h4>
        <p>1. Niniejszy regulamin określa zasady świadczenia usług stylizacji paznokci realizowanych pod marką <strong>My Passion Nails by M</strong>.</p>
        <p>2. Regulamin ma również zastosowanie do planowanej w przyszłości oferty cyfrowej (np. e-booki, szkolenia online) udostępnianej w sekcji „Sklep”, z zastrzeżeniem postanowień wskazanych w pkt 6.</p>

        <h4>2. Rezerwacje wizyt</h4>
        <p>1. Rezerwacja wizyty odbywa się w szczególności za pośrednictwem zewnętrznego systemu rezerwacji <strong>Reservio</strong>.</p>
        <p>2. Szczegółowe warunki rezerwacji, w tym dostępne terminy, zasady odwołania, zmiany terminu oraz ewentualne dodatkowe wymagania, mogą zostać wskazane w systemie Reservio lub przekazane w korespondencji prowadzonej z Klientem.</p>
        <p>3. Klient jest zobowiązany do podania danych niezbędnych do dokonania rezerwacji oraz do kontaktu w sprawach organizacyjnych związanych z wizytą.</p>

        <h4>3. Zdobienia (nail art)</h4>
        <p>1. W przypadku zamiaru wykonania zdobień (nail art) Klient powinien poinformować o tym na etapie rezerwacji wizyty.</p>
        <p>2. Z uwagi na charakter zdobień czas trwania usługi może ulec wydłużeniu.</p>

        <h4>4. Płatności</h4>
        <p>1. Za wykonane usługi możliwe jest dokonanie płatności w następujących formach: <strong>kartą płatniczą</strong>, <strong>przelewem bankowym</strong>, <strong>gotówką</strong> oraz <strong>płatnością mobilną/QR</strong> (np. kod QR generowany przez bank).</p>
        <p>2. Informacja o dostępności konkretnej metody płatności może zostać potwierdzona na etapie rezerwacji wizyty lub bezpośrednio przed jej realizacją.</p>

        <h4>5. Reklamacje dotyczące usług</h4>
        <p>1. Wszelkie zastrzeżenia dotyczące wykonanej usługi Klient powinien zgłosić możliwie niezwłocznie, rekomendowany termin zgłoszenia to <strong>48 godzin od daty wizyty</strong>.</p>
        <p>2. Zgłoszenie reklamacyjne powinno zostać przesłane drogą e-mail na adres: <a href="mailto:mypassionnailsbym@gmail.com">mypassionnailsbym@gmail.com</a> oraz zawierać opis zgłaszanych zastrzeżeń, a także – o ile to możliwe – dokumentację zdjęciową.</p>
        <p>3. Reklamacje rozpatrywane są indywidualnie, z uwzględnieniem okoliczności sprawy.</p>

        <h4>6. Planowana oferta „Sklep” (treści cyfrowe)</h4>
        <p>1. Po uruchomieniu sekcji „Sklep” szczegółowe zasady dotyczące zakupu, dostępu do treści cyfrowych, ewentualnego odstąpienia od umowy oraz trybu reklamacji zostaną określone w uzupełnionym regulaminie dotyczącym sprzedaży treści cyfrowych.</p>
        <p>2. Do czasu uruchomienia „Sklepu” postanowienia niniejszego punktu mają charakter informacyjny.</p>

        <h4>7. Kontakt</h4>
        <p>Kontakt: <a href="mailto:mypassionnailsbym@gmail.com">mypassionnailsbym@gmail.com</a>.</p>
      `,
      cookies: `
        <h4>1. Informacje ogólne</h4>
        <p>1. Niniejsza Polityka cookies opisuje zasady wykorzystywania plików cookies oraz podobnych technologii (w tym mechanizmów pamięci przeglądarki, takich jak <strong>LocalStorage</strong>) w ramach strony internetowej <strong>My Passion Nails by M</strong>.</p>
        <p>2. Celem stosowania tych rozwiązań jest zapewnienie prawidłowego działania strony oraz poprawa wygody korzystania z jej funkcji.</p>

        <h4>2. Czym są pliki cookies i technologie podobne?</h4>
        <p>1. <strong>Pliki cookies</strong> to niewielkie pliki tekstowe zapisywane na urządzeniu końcowym użytkownika podczas korzystania ze strony internetowej.</p>
        <p>2. <strong>LocalStorage</strong> to mechanizm pamięci przeglądarki umożliwiający przechowywanie określonych informacji w urządzeniu użytkownika, technicznie odrębny od cookies.</p>

        <h4>3. Jakie dane są zapisywane przez stronę?</h4>
        <p>1. Strona wykorzystuje rozwiązania o charakterze minimalnym, w szczególności w celu:</p>
        <ul>
          <li>zapamiętania faktu akceptacji komunikatu dotyczącego plików cookies,</li>
          <li>zapamiętania wybranego przez użytkownika języka strony.</li>
        </ul>
        <p>2. W LocalStorage mogą być zapisywane m.in. następujące informacje: <strong>cookieAccepted</strong> oraz <strong>siteLang</strong>.</p>

        <h4>4. Podstawa i zakres korzystania z cookies / LocalStorage</h4>
        <p>1. Zastosowane mechanizmy służą przede wszystkim celom funkcjonalnym (zapewnienie działania i wygody korzystania ze strony).</p>
        <p>2. W przypadku wdrożenia dodatkowych narzędzi (np. analitycznych lub marketingowych) niniejsza polityka zostanie odpowiednio uzupełniona.</p>

        <h4>5. Zarządzanie cookies i LocalStorage</h4>
        <p>1. Użytkownik może w każdej chwili zmienić ustawienia dotyczące cookies w przeglądarce internetowej, w szczególności poprzez ich zablokowanie lub usunięcie.</p>
        <p>2. Użytkownik może również usunąć dane zapisane w LocalStorage w ustawieniach przeglądarki (np. poprzez wyczyszczenie danych witryny). Może to spowodować ponowne wyświetlenie komunikatu cookies oraz konieczność ponownego wyboru języka strony.</p>
        <p>3. Ograniczenie stosowania cookies lub usunięcie danych przeglądarki może wpływać na niektóre funkcjonalności strony.</p>

        <h4>6. Zmiany polityki</h4>
        <p>Polityka cookies może zostać zaktualizowana w przypadku zmian funkcjonalności strony lub zastosowania nowych narzędzi. Aktualna wersja polityki jest dostępna na stronie internetowej.</p>
      `
    },

    fr: {
      privacy: `
        <h4>1. Responsable du traitement</h4>
        <p>1. Le responsable du traitement des données personnelles est <strong>My Passion Nails by M</strong> (activité indépendante en Belgique – entrepreneur individuel), adresse : <strong>Joseph Possozplein 9, 1500 Halle</strong>, e-mail : <a href="mailto:mypassionnailsbym@gmail.com">mypassionnailsbym@gmail.com</a>.</p>
        <p>2. Numéro d’entreprise (enterprise number) : <strong>800.748.163</strong>.</p>

        <h4>2. Catégories de données traitées</h4>
        <p>1. Dans le cadre de l’utilisation du site et/ou d’une prise de contact, les données suivantes peuvent être traitées : <strong>nom et prénom</strong>, <strong>adresse e-mail</strong>, ainsi que – si elles sont fournies – <strong>numéro de téléphone</strong>, <strong>objet et contenu du message</strong>.</p>
        <p>2. L’étendue des données dépend du canal de contact choisi et des informations communiquées par la personne concernée.</p>

        <h4>3. Finalités et bases juridiques du traitement</h4>
        <p>Les données personnelles peuvent être traitées afin de :</p>
        <ul>
          <li><strong>répondre à la demande et assurer la correspondance</strong> – sur la base de l’art. 6(1)(b) du RGPD (mesures précontractuelles) et/ou de l’art. 6(1)(f) du RGPD (intérêt légitime à gérer la correspondance),</li>
          <li><strong>traiter les demandes relatives aux disponibilités et à l’organisation des rendez-vous</strong> – sur la base de l’art. 6(1)(b) du RGPD,</li>
          <li><strong>établir, exercer ou défendre des droits en justice</strong> – sur la base de l’art. 6(1)(f) du RGPD (intérêt légitime : protection des droits du responsable du traitement).</li>
        </ul>

        <h4>4. Réservations en ligne (Reservio)</h4>
        <p>1. La prise de rendez-vous peut être effectuée via le service externe <strong>Reservio</strong>.</p>
        <p>2. Les données communiquées lors de la réservation via Reservio peuvent être traitées conformément aux propres conditions et documents de Reservio.</p>
        <p>3. Le responsable du traitement peut recevoir les informations liées à la réservation dans la mesure nécessaire à la réalisation du service et à la communication avec le Client.</p>

        <h4>5. Informations relatives aux paiements</h4>
        <p>1. Les modes de paiement susceptibles d’être proposés sont : <strong>paiement par carte</strong>, <strong>virement bancaire</strong>, <strong>paiement en espèces</strong> et <strong>paiement mobile/QR</strong> (p. ex. un code QR généré par la banque).</p>
        <p>2. La disponibilité d’un mode de paiement donné peut être confirmée lors de la réservation ou avant la réalisation du rendez-vous.</p>
        <p>3. L'activité est un assujetti à la TVA enregistré, mais bénéficie d’une exonération de la perception et de la déduction de la TVA conformément à la législation fiscale en vigueur en Belgique.</p>

        <h4>6. Durée de conservation</h4>
        <p>1. Les données traitées dans le cadre de la correspondance sont conservées pendant la durée nécessaire au traitement de la demande et aux échanges.</p>
        <p>2. Elles peuvent être conservées également pendant la durée nécessaire à la sauvegarde d’éventuelles réclamations, en principe <strong>au maximum 12 mois</strong>, sauf obligation légale de conservation plus longue ou justification liée à la nature du dossier.</p>

        <h4>7. Destinataires des données</h4>
        <p>1. Les données personnelles peuvent être communiquées à des prestataires fournissant des services techniques et organisationnels (p. ex. services IT, hébergement de la messagerie).</p>
        <p>2. Les données peuvent également être communiquées à <strong>Reservio</strong> dans la mesure liée à la gestion des réservations.</p>
        <p>3. Les données personnelles <strong>ne sont ni vendues ni transmises</strong> à des tiers à des fins de marketing du responsable du traitement.</p>

        <h4>8. Droits de la personne concernée</h4>
        <p>La personne concernée dispose des droits prévus par le RGPD, notamment : droit d’accès, de rectification, d’effacement (dans les cas prévus), de limitation du traitement, de portabilité (lorsqu’il s’applique) ainsi que le droit d’opposition au traitement fondé sur l’art. 6(1)(f) du RGPD. Elle a également le droit d’introduire une réclamation auprès de l’autorité de contrôle compétente en Belgique.</p>

        <h4>9. Contact</h4>
        <p>Pour toute question relative à la protection des données : <a href="mailto:mypassionnailsbym@gmail.com">mypassionnailsbym@gmail.com</a>.</p>
      `,
      terms: `
        <h4>1. Dispositions générales</h4>
        <p>1. Les présentes conditions définissent les règles de prestation des services de stylisation des ongles fournis sous la marque <strong>My Passion Nails by M</strong>.</p>
        <p>2. Elles s’appliqueront également, à l’avenir, à une offre numérique (p. ex. e-books, formations en ligne) disponible dans la section « Boutique », sous réserve des dispositions du point 6.</p>

        <h4>2. Réservations de rendez-vous</h4>
        <p>1. La réservation s’effectue notamment via le système externe <strong>Reservio</strong>.</p>
        <p>2. Les conditions détaillées de réservation, y compris les disponibilités, les règles d’annulation, de modification du rendez-vous ainsi que d’éventuelles exigences supplémentaires, peuvent être indiquées dans Reservio ou communiquées au Client par correspondance.</p>
        <p>3. Le Client est tenu de fournir les informations nécessaires à la réservation et à la communication relative au rendez-vous.</p>

        <h4>3. Nail art / décorations</h4>
        <p>1. En cas de souhait de décorations (nail art), le Client doit en informer lors de la réservation.</p>
        <p>2. En raison de la nature des décorations, la durée de la prestation peut être prolongée.</p>

        <h4>4. Paiements</h4>
        <p>1. Le paiement des prestations peut être effectué par : <strong>carte</strong>, <strong>virement bancaire</strong>, <strong>espèces</strong> ou <strong>paiement mobile/QR</strong> (p. ex. un code QR généré par la banque).</p>
        <p>2. La disponibilité d’un mode de paiement donné peut être confirmée lors de la réservation ou avant la réalisation du rendez-vous.</p>

        <h4>5. Réclamations relatives aux services</h4>
        <p>1. Toute remarque ou réclamation concernant le service doit être signalée dans les meilleurs délais ; le délai recommandé est <strong>48 heures à compter du rendez-vous</strong>.</p>
        <p>2. La réclamation doit être envoyée par e-mail à : <a href="mailto:mypassionnailsbym@gmail.com">mypassionnailsbym@gmail.com</a>, en décrivant le problème et, dans la mesure du possible, en joignant des photos.</p>
        <p>3. Chaque réclamation est examinée individuellement, en tenant compte des circonstances.</p>

        <h4>6. Offre future « Boutique » (contenus numériques)</h4>
        <p>1. Après le lancement de la section « Boutique », les règles détaillées concernant l’achat, l’accès aux contenus numériques, l’éventuel droit de rétractation et la procédure de réclamation seront précisées dans une version complétée des conditions de vente de contenus numériques.</p>
        <p>2. Jusqu’à ce lancement, le présent point a un caractère informatif.</p>

        <h4>7. Contact</h4>
        <p>Contact : <a href="mailto:mypassionnailsbym@gmail.com">mypassionnailsbym@gmail.com</a>.</p>
      `,
      cookies: `
        <h4>1. Informations générales</h4>
        <p>1. La présente politique décrit l’utilisation des cookies et de technologies similaires (y compris des mécanismes de stockage du navigateur tels que <strong>LocalStorage</strong>) sur le site <strong>My Passion Nails by M</strong>.</p>
        <p>2. Ces solutions visent à assurer le bon fonctionnement du site et à améliorer le confort d’utilisation.</p>

        <h4>2. Définition des cookies et technologies similaires</h4>
        <p>1. Les <strong>cookies</strong> sont de petits fichiers texte enregistrés sur l’appareil de l’utilisateur lors de la consultation d’un site.</p>
        <p>2. <strong>LocalStorage</strong> est un mécanisme de stockage du navigateur permettant de conserver certaines informations sur l’appareil de l’utilisateur, distinct des cookies sur le plan technique.</p>

        <h4>3. Quelles informations sont enregistrées ?</h4>
        <p>1. Le site utilise des mécanismes minimaux principalement afin de :</p>
        <ul>
          <li>mémoriser l’acceptation de l’information relative aux cookies,</li>
          <li>mémoriser la langue choisie par l’utilisateur.</li>
        </ul>
        <p>2. À ces fins, les informations suivantes peuvent être enregistrées dans LocalStorage : <strong>cookieAccepted</strong> et <strong>siteLang</strong>.</p>

        <h4>4. Base et portée de l’utilisation</h4>
        <p>1. Les mécanismes utilisés ont un objectif essentiellement fonctionnel (bon fonctionnement et confort d’utilisation).</p>
        <p>2. En cas d’ajout d’outils analytiques ou marketing, la présente politique sera mise à jour en conséquence.</p>

        <h4>5. Gestion des cookies et de LocalStorage</h4>
        <p>1. L’utilisateur peut à tout moment modifier les paramètres des cookies dans son navigateur, notamment les bloquer ou les supprimer.</p>
        <p>2. Il est également possible de supprimer les données enregistrées dans LocalStorage via les paramètres du navigateur. Cela peut entraîner l’affichage à nouveau du message cookies et la nécessité de rechoisir la langue.</p>
        <p>3. La limitation des cookies ou la suppression des données du navigateur peut affecter certaines fonctionnalités du site.</p>

        <h4>6. Modifications de la politique</h4>
        <p>La politique peut être mise à jour en cas de changement de fonctionnalités du site ou d’ajout de nouveaux outils. La version à jour est disponible sur le site.</p>
      `
    }
  };

  const getLegalLang = () => (activeLang === "fr" ? "fr" : "pl"); // w modalu tylko PL/FR

  const openLegal = (type) => {
    if (!modal || !modalTitle || !modalBody) return;

    const L = getLegalLang();
    const docType = type || "privacy";
    modal.dataset.activeLegal = docType;

    const title =
      (legalTitles[L] && legalTitles[L][docType]) ||
      (legalTitles.pl && legalTitles.pl[docType]) ||
      "Dokumenty prawne";

    const html =
      (legalTexts[L] && legalTexts[L][docType]) ||
      (legalTexts.pl && legalTexts.pl[docType]) ||
      "<p>Brak treści dokumentu.</p>";

    modalTitle.textContent = title;
    modalBody.innerHTML = html;
    openModal();
  };

  // Linki w stopce: data-legal="privacy" | "terms" | "cookies"
  $$(".footer-link[data-legal]").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const type = link.dataset.legal || "privacy";
      openLegal(type);
    });
  });

  // Odśwież treść modala po zmianie języka, jeśli jest otwarty
  if (langSelect) {
    langSelect.addEventListener("change", () => {
      if (modal?.getAttribute("aria-hidden") === "false" && modal.dataset.activeLegal) {
        openLegal(modal.dataset.activeLegal);
      }
    });
  }

  if (modalClose) modalClose.addEventListener("click", closeModal);
  if (modalBackdrop) modalBackdrop.addEventListener("click", closeModal);
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal?.getAttribute("aria-hidden") === "false") closeModal();
  });

  // ========= Contact form -> mailto (studio@mypassionnailsbym.com) =========
  const form = $("#contact-form");
  const successMsg = $("#form-success-message");

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = ($("#cf-name")?.value || "").trim();
      const email = ($("#cf-email")?.value || "").trim();
      const phone = ($("#cf-phone")?.value || "").trim();
      const topic = ($("#cf-topic")?.value || "").trim();
      const message = ($("#cf-message")?.value || "").trim();

      const subject = encodeURIComponent(`[Formularz] ${topic} — ${name}`);
      const body = encodeURIComponent(
        `Imię i nazwisko: ${name}\n` +
          `E-mail: ${email}\n` +
          `Telefon: ${phone}\n` +
          `Temat: ${topic}\n\n` +
          `Wiadomość:\n${message}\n`
      );

      window.location.href = `mailto:studio@mypassionnailsbym.com?subject=${subject}&body=${body}`;

      if (successMsg) successMsg.hidden = false;
      form.reset();
    });
  }
})();
