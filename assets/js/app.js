/* =============================================================================
   Renderizador de la landing page.
   Lee ./data/content.json y construye la navegación, el main y el footer.
   Sin dependencias. Cada bloque de comportamiento es independiente.
   ============================================================================= */
(function () {
  'use strict';

  var DATA_URL = './data/content.json';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Utilidades ───────────────────────────────────────────────────────────── */

  /** Escapa el texto que viene del JSON antes de inyectarlo como HTML. */
  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /** Atributo data-reveal con retraso opcional en cascada. */
  function reveal(delay) {
    return delay ? ' data-reveal data-reveal-delay="' + delay + '"' : ' data-reveal';
  }

  /** Iconos de la sección de beneficios, elegidos por nombre desde el JSON. */
  var ICONS = {
    truck: '<path d="M2 9h14v12H2zM16 13h6l4 4v4h-10z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>' +
           '<circle cx="8" cy="24" r="2.6" fill="none" stroke="currentColor" stroke-width="1.8"/>' +
           '<circle cx="22" cy="24" r="2.6" fill="none" stroke="currentColor" stroke-width="1.8"/>',
    card:  '<rect x="3" y="8" width="26" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/>' +
           '<path d="M3 13h26" stroke="currentColor" stroke-width="1.8"/>' +
           '<path d="M7 19h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    shield:'<path d="M16 3l11 4v9c0 6.6-4.6 11.4-11 13.4C9.6 27.4 5 22.6 5 16V7z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>' +
           '<path d="M11 15.6l3.4 3.4L21 12.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    star:  '<path d="M16 3l3.6 7.4 8.1 1.2-5.9 5.7 1.4 8.1L16 21.6 8.8 25.4l1.4-8.1-5.9-5.7 8.1-1.2z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>'
  };

  function icon(name) {
    return '<svg viewBox="0 0 32 32" aria-hidden="true" class="benefit__icon">' + (ICONS[name] || ICONS.star) + '</svg>';
  }

  /* El logotipo ya contiene el nombre de la marca, así que se usa como marca
     gráfica y el nombre en texto queda sólo para lectores de pantalla. */
  function brandMark(site) {
    if (!site.logo || !site.logo.src) {
      return '<span class="brand__name" aria-hidden="true">' + esc(site.brand) + '</span>';
    }
    return '<img class="brand__logo" src="' + esc(site.logo.src) + '" alt="" decoding="async">';
  }

  var WA_ICON = '<svg class="icon-wa" viewBox="0 0 24 24" aria-hidden="true"><use href="#wa-glyph"></use></svg>';

  /** El <source> webp sólo se emite si el JSON trae esa versión de la foto. */
  function webpSource(url) {
    return url ? '<source srcset="' + esc(url) + '" type="image/webp" data-src-webp>' : '';
  }

  function brand(extraClass, site) {
    return '<a class="brand' + (extraClass ? ' ' + extraClass : '') + '" href="#inicio" aria-label="' +
             esc(site.brand) + ', ir al inicio">' + brandMark(site) +
             '<span class="brand__tag">' + esc(site.tagline) + '</span>' +
           '</a>';
  }

  /* ── Plantillas ───────────────────────────────────────────────────────────── */

  function navTemplate(data) {
    var links = data.nav.links.map(function (link) {
      return '<a href="' + esc(link.href) + '">' + esc(link.label) + '</a>';
    }).join('');

    return '<div class="nav__inner">' +
             brand('', data.site) +
             '<nav class="nav__links" id="nav-menu" aria-label="Navegación principal">' +
               links +
               '<a class="nav__cta btn btn--sm btn--dark" href="#" data-wa-product="' +
                 esc(data.whatsapp.fallbackProduct) + '">' + esc(data.nav.cta.label) + '</a>' +
             '</nav>' +
             '<button class="nav__toggle" id="nav-toggle" type="button" aria-controls="nav-menu" ' +
                     'aria-expanded="false" aria-label="Abrir menú">' +
               '<span class="nav__bar"></span><span class="nav__bar"></span>' +
             '</button>' +
           '</div>';
  }

  function heroTemplate(data) {
    var hero = data.hero;

    var actions = hero.actions.map(function (action) {
      var attrs = action.whatsapp
        ? ' href="#" data-wa-product="' + esc(data.whatsapp.fallbackProduct) + '"'
        : ' href="' + esc(action.href || '#') + '"';
      return '<a class="btn btn--' + esc(action.style || 'dark') + '"' + attrs + '>' +
               esc(action.label) +
               (action.arrow ? '<svg class="icon-arrow" viewBox="0 0 16 16" aria-hidden="true"><use href="#icon-arrow"></use></svg>' : '') +
             '</a>';
    }).join('');

    var badges = hero.badges.map(function (badge) {
      return '<li>' + esc(badge) + '</li>';
    }).join('');

    return '<section class="hero" id="inicio">' +
             '<div class="hero__glow" aria-hidden="true"></div>' +
             '<div class="container hero__inner">' +
               '<div class="hero__copy">' +
                 '<picture class="hero__logo"' + reveal(0) + '>' +
                   webpSource(data.site.logo.webp) +
                   '<img src="' + esc(data.site.logo.src) + '" alt="' +
                     esc(data.site.logo.alt) + '" fetchpriority="high" decoding="async">' +
                 '</picture>' +
                 '<p class="eyebrow"' + reveal(1) + '>' + esc(hero.eyebrow) + '</p>' +
                 '<h1 class="hero__title"' + reveal(2) + '>' + esc(hero.title) +
                   '<em>' + esc(hero.titleEm) + '</em></h1>' +
                 '<p class="lead hero__lead"' + reveal(3) + '>' + esc(hero.lead) + '</p>' +
                 '<div class="hero__actions"' + reveal(4) + '>' + actions + '</div>' +
                 '<ul class="hero__badges"' + reveal(5) + '>' + badges + '</ul>' +
               '</div>' +
               sliderTemplate(hero.slider) +
             '</div>' +
             '<div class="hero__scroll" aria-hidden="true"><span></span></div>' +
           '</section>';
  }

  /* Carrusel del hero: una foto por línea de producto. Las diapositivas se
     apilan y se cruzan por opacidad; el avance automático lo mueve el JS. */
  function sliderTemplate(slider) {
    if (!slider || !slider.slides || !slider.slides.length) return '';

    var slides = slider.slides.map(function (slide, index) {
      var open = slide.href
        ? '<a class="hero__slide' + (index === 0 ? ' is-active' : '') + '" href="' + esc(slide.href) + '"'
        : '<div class="hero__slide' + (index === 0 ? ' is-active' : '') + '"';

      return open + ' data-slide aria-hidden="' + (index === 0 ? 'false' : 'true') + '"' +
               (index === 0 ? '' : ' tabindex="-1"') + '>' +
               webpSource(slide.webp) +
               '<img src="' + esc(slide.src) + '" alt="' + esc(slide.alt) + '" ' +
                 (index === 0 ? 'fetchpriority="high"' : 'loading="lazy"') + ' decoding="async">' +
               (slide.label ? '<span class="hero__slide-label">' + esc(slide.label) + '</span>' : '') +
             (slide.href ? '</a>' : '</div>');
    }).join('');

    var dots = slider.slides.map(function (slide, index) {
      return '<button type="button" class="hero__dot' + (index === 0 ? ' is-active' : '') + '" ' +
               'data-dot="' + index + '" aria-label="Ver ' + esc(slide.label || 'foto ' + (index + 1)) + '"' +
               (index === 0 ? ' aria-current="true"' : '') + '></button>';
    }).join('');

    return '<div class="hero__slider" data-slider data-interval="' + (slider.interval || 3000) + '"' +
              ' role="group" aria-roledescription="carrusel" aria-label="Fotos de los productos"' +
              reveal(3) + '>' +
             '<div class="hero__stage">' + slides + '</div>' +
             '<div class="hero__dots">' + dots + '</div>' +
           '</div>';
  }

  function galleryTemplate(product) {
    var first = product.gallery[0] || {};
    var dark = product.theme === 'dark' ? ' gallery__stage--dark' : '';

    var thumbs = product.gallery.map(function (shot, index) {
      return '<button type="button" class="thumb' + (index === 0 ? ' is-active' : '') + '" ' +
               'data-webp="' + esc(shot.webp || '') + '" data-jpg="' + esc(shot.src) + '" ' +
               'data-alt="' + esc(shot.alt) + '">' +
               '<img src="' + esc(shot.src) + '" alt="" loading="lazy" decoding="async">' +
             '</button>';
    }).join('');

    return '<div class="product__media" data-gallery' + reveal(0) + '>' +
             '<figure class="gallery__stage' + dark + '" data-placeholder="' + esc(first.alt) + '">' +
               '<picture>' +
                 webpSource(first.webp) +
                 '<img src="' + esc(first.src) + '" alt="' + esc(first.alt) + '" ' +
                   'loading="lazy" decoding="async" data-gallery-img>' +
               '</picture>' +
             '</figure>' +
             '<div class="gallery__thumbs" role="group" aria-label="Más fotos de ' + esc(product.waProduct) + '">' +
               thumbs +
             '</div>' +
           '</div>';
  }

  function optionsTemplate(product, startDelay) {
    return product.options.map(function (group, index) {
      var labelId = product.id + '-' + index + '-label';

      var controls = group.values.map(function (raw, position) {
        var value = typeof raw === 'string' ? raw : raw.value;
        var active = position === 0;
        var common = ' role="radio" aria-checked="' + (active ? 'true' : 'false') +
                     '" data-value="' + esc(value) + '"';

        if (group.type === 'swatches') {
          return '<button type="button" class="swatch' + (active ? ' is-active' : '') + '"' + common +
                   ' style="--tone:' + esc(raw.tone) + '" title="' + esc(value) + '">' +
                   '<span class="sr-only">' + esc(value) + '</span>' +
                 '</button>';
        }
        return '<button type="button" class="chip' + (active ? ' is-active' : '') + '"' + common + '>' +
                 esc(value) + '</button>';
      }).join('');

      return '<div class="options"' + reveal(startDelay + index) + '>' +
               '<p class="options__label" id="' + labelId + '">' + esc(group.label) +
                 (group.hint ? ' <span class="options__hint">' + esc(group.hint) + '</span>' : '') +
               '</p>' +
               '<div class="' + (group.type === 'swatches' ? 'swatches' : 'chips') + '" role="radiogroup" ' +
                    'aria-labelledby="' + labelId + '" data-option="' + esc(group.label) + '">' +
                 controls +
               '</div>' +
             '</div>';
    }).join('');
  }

  function productTemplate(product) {
    var titleId = product.id + '-title';
    var delay = 2;

    var options = optionsTemplate(product, delay);
    delay += product.options.length;

    var specs = '';
    if (product.specs && product.specs.length) {
      specs = '<ul class="specs"' + reveal(delay) + '>' +
                product.specs.map(function (spec) { return '<li>' + esc(spec) + '</li>'; }).join('') +
              '</ul>';
      delay += 1;
    }

    return '<section class="section section--' + esc(product.theme) + '" id="' + esc(product.id) + '" ' +
                    'aria-labelledby="' + titleId + '">' +
             '<div class="container">' +
               '<header class="section__head"' + reveal(0) + '>' +
                 '<p class="eyebrow">' + esc(product.eyebrow) + '</p>' +
                 '<h2 class="section__title" id="' + titleId + '">' + esc(product.title) + '</h2>' +
                 '<p class="lead">' + esc(product.lead) + '</p>' +
               '</header>' +
               '<div class="product' + (product.reverse ? ' product--reverse' : '') + '">' +
                 galleryTemplate(product) +
                 '<div class="product__info" data-wa-card data-product="' + esc(product.waProduct) + '">' +
                   '<p class="promo' + (product.promo.style === 'light' ? ' promo--light' : '') + '"' + reveal(0) + '>' +
                     esc(product.promo.text) + '</p>' +
                   '<p class="product__desc"' + reveal(1) + '>' + esc(product.description) + '</p>' +
                   options +
                   specs +
                   '<div class="buybox"' + reveal(delay) + '>' +
                     '<div class="price">' +
                       '<span class="price__from">' + esc(product.price.label) + '</span>' +
                       '<span class="price__value' + (product.price.small ? ' price__value--sm' : '') + '">' +
                         esc(product.price.value) + '</span>' +
                     '</div>' +
                     '<a class="btn btn--' + esc(product.button.style) + ' btn--wide" href="#" ' +
                        'data-wa-product="' + esc(product.waProduct) + '">' +
                       WA_ICON + esc(product.button.label) +
                     '</a>' +
                   '</div>' +
                 '</div>' +
               '</div>' +
             '</div>' +
           '</section>';
  }

  function benefitsTemplate(block) {
    var items = block.items.map(function (item, index) {
      return '<li class="benefit"' + reveal(index) + '>' +
               icon(item.icon) +
               '<h3>' + esc(item.title) + '</h3>' +
               '<p>' + esc(item.text) + '</p>' +
             '</li>';
    }).join('');

    return '<section class="section section--' + esc(block.theme) + '" id="' + esc(block.id) + '" ' +
                    'aria-labelledby="' + esc(block.id) + '-title">' +
             '<div class="container">' +
               '<header class="section__head section__head--center"' + reveal(0) + '>' +
                 '<p class="eyebrow">' + esc(block.eyebrow) + '</p>' +
                 '<h2 class="section__title" id="' + esc(block.id) + '-title">' + esc(block.title) + '</h2>' +
               '</header>' +
               '<ul class="benefits">' + items + '</ul>' +
             '</div>' +
           '</section>';
  }

  function stepsTemplate(block) {
    var items = block.items.map(function (item, index) {
      return '<li class="step"' + reveal(index) + '>' +
               '<span class="step__num">' + esc(item.num) + '</span>' +
               '<h3>' + esc(item.title) + '</h3>' +
               '<p>' + esc(item.text) + '</p>' +
             '</li>';
    }).join('');

    return '<section class="section section--' + esc(block.theme) + '" id="' + esc(block.id) + '" ' +
                    'aria-labelledby="' + esc(block.id) + '-title">' +
             '<div class="container">' +
               '<header class="section__head section__head--center"' + reveal(0) + '>' +
                 '<p class="eyebrow">' + esc(block.eyebrow) + '</p>' +
                 '<h2 class="section__title" id="' + esc(block.id) + '-title">' + esc(block.title) + '</h2>' +
               '</header>' +
               '<ol class="steps">' + items + '</ol>' +
             '</div>' +
           '</section>';
  }

  function faqTemplate(block) {
    var items = block.items.map(function (item) {
      return '<details class="faq__item">' +
               '<summary>' + esc(item.q) + '</summary>' +
               '<div class="faq__body"><p>' + esc(item.a) + '</p></div>' +
             '</details>';
    }).join('');

    return '<section class="section section--' + esc(block.theme) + '" id="' + esc(block.id) + '" ' +
                    'aria-labelledby="' + esc(block.id) + '-title">' +
             '<div class="container container--narrow">' +
               '<header class="section__head section__head--center"' + reveal(0) + '>' +
                 '<p class="eyebrow">' + esc(block.eyebrow) + '</p>' +
                 '<h2 class="section__title" id="' + esc(block.id) + '-title">' + esc(block.title) + '</h2>' +
               '</header>' +
               '<div class="faq"' + reveal(0) + '>' + items + '</div>' +
             '</div>' +
           '</section>';
  }

  function ctaTemplate(data) {
    var cta = data.cta;
    return '<section class="cta" aria-labelledby="cta-title">' +
             '<div class="container container--narrow cta__inner"' + reveal(0) + '>' +
               '<h2 class="cta__title" id="cta-title">' + esc(cta.title) + '</h2>' +
               '<p class="lead">' + esc(cta.lead) + '</p>' +
               '<a class="btn btn--wa btn--lg" href="#" data-wa-product="' +
                 esc(data.whatsapp.fallbackProduct) + '">' + WA_ICON + esc(cta.button) + '</a>' +
               '<p class="cta__note">' + esc(cta.note) + '</p>' +
             '</div>' +
           '</section>';
  }

  function footerTemplate(data) {
    var columns = data.footer.columns.map(function (column) {
      var links = column.links.map(function (link) {
        var attrs = link.whatsapp
          ? 'href="#" data-wa-product="' + esc(data.whatsapp.fallbackProduct) + '"'
          : 'href="' + esc(link.href) + '"';
        return '<a ' + attrs + '>' + esc(link.label) + '</a>';
      }).join('');

      var meta = (column.meta || []).map(function (line) {
        return '<span class="footer__meta">' + esc(line) + '</span>';
      }).join('');

      return '<div><h3>' + esc(column.title) + '</h3>' + links + meta + '</div>';
    }).join('');

    var legal = data.footer.legal.map(function (line) {
      return '<p>' + esc(line.replace('{year}', data.site.year || new Date().getFullYear())) + '</p>';
    }).join('');

    return '<div class="container footer__inner">' +
             '<div class="footer__brand">' + brand('brand--footer', data.site) + '</div>' +
             '<nav class="footer__nav" aria-label="Navegación del pie de página">' + columns + '</nav>' +
           '</div>' +
           '<div class="container footer__legal">' + legal + '</div>';
  }

  function fabTemplate(data) {
    return '<a class="fab" href="#" data-wa-product="' + esc(data.whatsapp.fallbackProduct) + '" ' +
              'aria-label="' + esc(data.fab.aria) + '">' +
             '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#wa-glyph"></use></svg>' +
             '<span class="fab__label">' + esc(data.fab.label) + '</span>' +
           '</a>';
  }

  /* ── Comportamiento ───────────────────────────────────────────────────────── */

  /** Devuelve "Estilo: Manga corta · Talla: M" con lo seleccionado en la ficha. */
  function selectedOptions(card) {
    if (!card) return '';

    return Array.prototype.map
      .call(card.querySelectorAll('[data-option]'), function (group) {
        var active = group.querySelector('.is-active');
        return active ? group.dataset.option + ': ' + active.dataset.value : '';
      })
      .filter(Boolean)
      .join(' · ');
  }

  function whatsappUrl(link, wa) {
    var product = link.dataset.waProduct || wa.fallbackProduct;
    var options = selectedOptions(link.closest('[data-wa-card]'));

    var text = wa.greeting + ' ' + product + '.';
    if (options) text += '\n' + options + '.';
    text += '\n' + wa.closing;

    return 'https://wa.me/' + wa.number + '?text=' + encodeURIComponent(text);
  }

  /* El href se resuelve también en el clic para respetar la última selección,
     pero se precarga para que el enlace sirva si se copia o se abre en otra
     pestaña. */
  function wireWhatsapp(wa, scope) {
    Array.prototype.forEach.call((scope || document).querySelectorAll('[data-wa-product]'), function (link) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.href = whatsappUrl(link, wa);
      link.addEventListener('click', function () { link.href = whatsappUrl(link, wa); });
    });
  }

  function wireOptions(wa) {
    Array.prototype.forEach.call(document.querySelectorAll('[data-option]'), function (group) {
      group.addEventListener('click', function (event) {
        var option = event.target.closest('.chip, .swatch');
        if (!option || !group.contains(option)) return;

        Array.prototype.forEach.call(group.children, function (sibling) {
          var isTarget = sibling === option;
          sibling.classList.toggle('is-active', isTarget);
          sibling.setAttribute('aria-checked', String(isTarget));
        });

        var card = group.closest('[data-wa-card]');
        Array.prototype.forEach.call((card || document).querySelectorAll('[data-wa-product]'), function (link) {
          link.href = whatsappUrl(link, wa);
        });
      });
    });
  }

  function wireGalleries() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-gallery]'), function (gallery) {
      var stage = gallery.querySelector('.gallery__stage');
      var image = gallery.querySelector('[data-gallery-img]');
      var webpSource = gallery.querySelector('[data-src-webp]');

      gallery.addEventListener('click', function (event) {
        var thumb = event.target.closest('.thumb');
        if (!thumb || thumb.classList.contains('is-active')) return;

        Array.prototype.forEach.call(gallery.querySelectorAll('.thumb'), function (other) {
          other.classList.toggle('is-active', other === thumb);
        });

        var apply = function () {
          if (webpSource) webpSource.srcset = thumb.dataset.webp;
          image.src = thumb.dataset.jpg;
          image.alt = thumb.dataset.alt || '';
          stage.dataset.placeholder = thumb.dataset.alt || '';
          stage.classList.remove('is-swapping');
        };

        if (reduceMotion) { apply(); return; }

        // Fundido corto: se oculta la imagen, se cambia y se vuelve a mostrar.
        stage.classList.add('is-swapping');
        window.setTimeout(apply, 180);
      });
    });
  }

  /* Avanza solo cada N ms y se detiene mientras el cursor o el teclado están
     encima, y mientras la pestaña no se ve. Con prefers-reduced-motion no se
     mueve solo: quedan los puntos para cambiar de foto a mano. */
  function wireSlider() {
    var slider = document.querySelector('[data-slider]');
    if (!slider) return;

    var slides = slider.querySelectorAll('[data-slide]');
    var dots = slider.querySelectorAll('[data-dot]');
    if (slides.length < 2) return;

    var interval = parseInt(slider.dataset.interval, 10) || 3000;
    var current = 0;
    var timer = null;

    function show(next) {
      current = (next + slides.length) % slides.length;

      Array.prototype.forEach.call(slides, function (slide, index) {
        var active = index === current;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', String(!active));
        // Sólo la foto visible es enfocable: el tabulador no pasa por las ocultas.
        if (slide.tagName === 'A') {
          if (active) { slide.removeAttribute('tabindex'); } else { slide.setAttribute('tabindex', '-1'); }
        }
      });

      Array.prototype.forEach.call(dots, function (dot, index) {
        var active = index === current;
        dot.classList.toggle('is-active', active);
        if (active) { dot.setAttribute('aria-current', 'true'); } else { dot.removeAttribute('aria-current'); }
      });
    }

    function play() {
      if (reduceMotion || timer) return;
      timer = window.setInterval(function () { show(current + 1); }, interval);
    }

    function pause() {
      if (!timer) return;
      window.clearInterval(timer);
      timer = null;
    }

    Array.prototype.forEach.call(dots, function (dot, index) {
      dot.addEventListener('click', function () {
        show(index);
        pause(); play();   // reinicia la cuenta tras un clic
      });
    });

    slider.addEventListener('mouseenter', pause);
    slider.addEventListener('mouseleave', play);
    slider.addEventListener('focusin', pause);
    slider.addEventListener('focusout', play);

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { pause(); } else { play(); }
    });

    play();
  }

  function wireNav() {
    var nav = document.getElementById('nav');
    var toggle = document.getElementById('nav-toggle');
    var menu = document.getElementById('nav-menu');

    if (nav) {
      var onScroll = function () { nav.classList.toggle('is-scrolled', window.scrollY > 8); };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    if (!toggle || !menu) return;

    var setMenu = function (open) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      menu.classList.toggle('is-open', open);
    };

    toggle.addEventListener('click', function () {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });

    // El menú se cierra al navegar, al pulsar Escape o al volver al ancho grande.
    menu.addEventListener('click', function (event) {
      if (event.target.closest('a')) setMenu(false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') setMenu(false);
    });

    window.matchMedia('(min-width: 721px)').addEventListener('change', function (event) {
      if (event.matches) setMenu(false);
    });
  }

  function wireReveal() {
    var targets = document.querySelectorAll('[data-reveal]');

    Array.prototype.forEach.call(targets, function (el) {
      var delay = el.getAttribute('data-reveal-delay');
      if (delay) el.style.setProperty('--reveal-delay', delay);
    });

    if (reduceMotion || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(targets, function (el) { el.classList.add('is-in'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    Array.prototype.forEach.call(targets, function (el) { observer.observe(el); });
  }

  /* Mientras las fotos no existan en assets/img, el marco muestra el texto
     alternativo en lugar del icono de imagen rota. */
  function wireMissingImages() {
    Array.prototype.forEach.call(document.querySelectorAll('.gallery__stage img'), function (img) {
      img.addEventListener('error', function () {
        var stage = img.closest('.gallery__stage');
        if (stage) stage.classList.add('is-missing');
      });
      img.addEventListener('load', function () {
        var stage = img.closest('.gallery__stage');
        if (stage) stage.classList.remove('is-missing');
      });
    });

    var logo = document.querySelector('.hero__logo img');
    if (logo) {
      logo.addEventListener('error', function () {
        var picture = logo.closest('.hero__logo');
        if (picture) picture.style.display = 'none';
      });
    }
  }

  /* ── Arranque ─────────────────────────────────────────────────────────────── */

  function render(data) {
    document.querySelector('[data-render="nav"]').innerHTML = navTemplate(data);

    document.querySelector('[data-render="main"]').innerHTML =
      heroTemplate(data) +
      data.products.map(productTemplate).join('') +
      benefitsTemplate(data.benefits) +
      stepsTemplate(data.steps) +
      faqTemplate(data.faq) +
      ctaTemplate(data);

    document.querySelector('[data-render="footer"]').innerHTML = footerTemplate(data);
    document.body.insertAdjacentHTML('beforeend', fabTemplate(data));

    if (data.site.brand) {
      document.title = data.site.brand + ' — ' + data.site.tagline;
    }

    wireWhatsapp(data.whatsapp);
    wireOptions(data.whatsapp);
    wireGalleries();
    wireSlider();
    wireNav();
    wireReveal();
    wireMissingImages();
  }

  /** Copia incrustada en index.html por tools/sync-content.js. */
  function inlineContent() {
    var tag = document.getElementById('content-fallback');
    if (!tag || !tag.textContent.trim()) return null;
    return JSON.parse(tag.textContent);
  }

  /* Servida por HTTP gana el .json, que es la fuente editable. Abierta con doble
     clic (file://) el navegador bloquea fetch, así que se usa la copia del HTML.
     Sólo si faltan las dos se muestra el aviso. */
  function loadContent() {
    return fetch(DATA_URL, { cache: 'no-cache' })
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status + ' al pedir ' + DATA_URL);
        return response.json();
      })
      .catch(function (error) {
        var inline = inlineContent();
        if (!inline) throw error;
        if (location.protocol !== 'file:') {
          console.warn('No se pudo leer ' + DATA_URL + ' (' + error.message +
                       '). Se usó la copia incrustada en index.html.');
        }
        return inline;
      });
  }

  function showNotice(error) {
    document.querySelector('[data-render="main"]').innerHTML =
      '<div class="notice">' +
        '<h1>No se pudo cargar el contenido</h1>' +
        '<p>No se encontró <strong>data/content.json</strong> ni la copia incrustada en ' +
          '<strong>index.html</strong>. Si acabas de editar el JSON, revisa que sea válido y ejecuta:</p>' +
        '<code>node tools/sync-content.js</code>' +
        '<p>' + esc(error && error.message ? error.message : error) + '</p>' +
      '</div>';
  }

  loadContent().then(render).catch(showNotice);
})();
