import Vue from 'vue';
import Mdui from 'mdui';
import App from './App.vue';
import { router } from './router';
import './registerServiceWorker';
import i18n from './i18n';
import darkmodejs from '@yzfe/darkmodejs';
import { locales, langEnum, langMigration } from './store/lang';
import NamespacedLocalStorage from './utils/NamespacedLocalStorage';
import pickClone from '@/utils/pickClone';

import defineVueProperty from './plugins/defineVueProperty';
import './plugins/globalComponents';
import './plugins/mdui';
import './plugins/lodash';
import './plugins/theme';
import './plugins/gtag';

if (process.env.NODE_ENV !== 'production') {
  Vue.config.devtools = true;
}

// eslint-disable-next-line no-console
defineVueProperty('log', console.log);

const nls = new NamespacedLocalStorage('home');

const CDN_PUBLIC_PATH = process.env.VUE_APP_CDN;
const $ = Mdui.JQ;

new Vue({
  router,
  render: h => h(App),
  data: {
    githubRepo: 'https://github.com/arkntools/arknights-toolbox',
    color: {
      tagBtnHead: ['mdui-color-teal', 'mdui-color-teal-300'],
      redBtn: ['mdui-color-red', 'mdui-color-indigo-a100 mdui-ripple-black'],
      pinkBtn: ['mdui-color-pink-accent', 'mdui-color-indigo-a100 mdui-ripple-black'],
      pinkText: ['mdui-text-color-pink-accent', 'mdui-text-color-pink-a100'],
      dialogTransparentBtn: [null, 'mdui-text-color-indigo-a100'],
    },
    screenWidth: 0,
    nm: false,
    deferredPrompt: false,
    setting: {
      rememberLastPage: true,
      darkTheme: true,
      darkThemeFollowSystem: true,
    },
    systemDarkTheme: false,
    server: locales[0].short,
    locales,
    localeEnum: langEnum,
    materialListRendering: true,
    themeEnum: {
      light: 0,
      dark: 1,
      followSystem: 2,
    },
    importItemsListening: false,
  },
  watch: {
    setting: {
      handler(val) {
        nls.setItem('setting', val);
      },
      deep: true,
    },
    locale(lang) {
      this.updateTitle();
      this.$emit('tab-need-updated');
      nls.setItem('lang', lang);
    },
    server(server) {
      nls.setItem('server', server);
    },
    'setting.darkTheme'() {
      this.updatedarkTheme();
    },
    'setting.darkThemeFollowSystem'() {
      this.updatedarkTheme();
    },
    systemDarkTheme() {
      this.updatedarkTheme();
    },
  },
  computed: {
    canUseCDN() {
      return !!CDN_PUBLIC_PATH;
    },
    isCDNEnable() {
      return this.canUseCDN;
    },
    staticBaseURL() {
      return this.isCDNEnable ? CDN_PUBLIC_PATH : '';
    },
    smallScreen() {
      return this.$root.screenWidth <= 450;
    },
    locale: {
      get() {
        return this.$i18n.locale;
      },
      set(val) {
        this.$i18n.locale = val;
      },
    },
    localeSelectKey() {
      return this.locale + Date.now();
    },
    localeCN() {
      return this.locale === 'cn';
    },
    localeTW() {
      return this.locale === 'tw';
    },
    localeZH() {
      return this.localeCN || this.localeTW;
    },
    localeName() {
      return this.locales.find(({ short }) => short === this.locale).long;
    },
    serverCN() {
      return this.server === 'cn';
    },
    serverNotCN() {
      return !this.serverCN;
    },
    i18nServerMessages() {
      return this.$i18n.messages[this.server];
    },
    dark() {
      const { darkTheme, darkThemeFollowSystem } = this.setting;
      return (
        darkTheme && (!darkThemeFollowSystem || (darkThemeFollowSystem && this.systemDarkTheme))
      );
    },
    themeSetting: {
      get() {
        const { light, dark, followSystem } = this.themeEnum;
        const { darkTheme, darkThemeFollowSystem } = this.setting;
        if (darkTheme) {
          if (darkThemeFollowSystem) return followSystem;
          return dark;
        }
        return light;
      },
      set(val) {
        const { light, dark, followSystem } = this.themeEnum;
        const { setting } = this;
        switch (val) {
          case light:
            setting.darkTheme = false;
            break;
          case dark:
            setting.darkTheme = true;
            setting.darkThemeFollowSystem = false;
            break;
          case followSystem:
            setting.darkTheme = true;
            setting.darkThemeFollowSystem = true;
            break;
        }
      },
    },
  },
  methods: {
    routeIs(name) {
      return this.$route.name === name;
    },
    avatar(name) {
      return `${this.staticBaseURL}assets/img/avatar/${name}.png`;
    },
    materialImage(name) {
      return `${this.staticBaseURL}assets/img/item/${name}.png`;
    },
    humanReadableSize(size) {
      const unit = ['B', 'KB', 'MB'];
      let lv = 0;
      while (size > 1024 && lv < 2) {
        size /= 1024;
        lv++;
      }
      return `${size.toFixed(2)} ${unit[lv]}`;
    },
    installPWA() {
      if (this.deferredPrompt) {
        this.deferredPrompt.prompt();
        this.deferredPrompt.userChoice.then(choiceResult => {
          this.$gtag.event(`a2hs_prompt_${choiceResult.outcome}`, {
            event_category: 'a2hs',
            event_label: 'prompt',
          });
          this.deferredPrompt = false;
        });
      }
    },
    isImplementedChar(name) {
      return name in this.i18nServerMessages.character;
    },
    isImplementedMaterial(name) {
      return name in this.i18nServerMessages.material;
    },
    updateTitle() {
      document.title = this.$t('app.title');
    },
    updatedarkTheme() {
      const $body = $('body');
      if (this.dark) {
        $body.removeClass('mdui-theme-accent-pink');
        $body.addClass('mdui-theme-layout-dark mdui-theme-accent-indigo');
      } else {
        $body.removeClass('mdui-theme-layout-dark mdui-theme-accent-indigo');
        $body.addClass('mdui-theme-accent-pink');
      }
    },
    localeIs(locale) {
      return this.locale === locale;
    },
    localeNot(locales = []) {
      return !locales.includes(this.locale);
    },
    getWikiHref({ name, appellation }) {
      if (!(name && appellation)) return '';
      const getLocaleName = (locale = this.locale) => this.$i18n.messages[locale].character[name];
      switch (this.locale) {
        case 'cn':
        case 'tw':
          return `http://prts.wiki/w/${getLocaleName('cn')}`;
        case 'jp':
          return `https://wiki.gamerclub.jp/anwiki/index.php?title=${getLocaleName()}`;
        case 'kr':
          return `https://namu.wiki/w/${getLocaleName()}(명일방주)`;
        default:
          return `https://gamepress.gg/arknights/operator/${appellation.toLowerCase()}`;
      }
    },
    pureName(name) {
      return name.toLowerCase?.().replace(/ /g, '');
    },
    getSearchGroup({ name, appellation, pinyin: { full, head }, romaji }) {
      const pureAppellation = this.pureName(appellation);
      const pureName = this.pureName(this.$t(`character.${name}`)) || pureAppellation;
      head = head || pureName;
      full = full || pureName;
      romaji = romaji || pureName;
      if (this.localeZH) {
        return [head, full, pureName, pureAppellation, romaji];
      } else if (this.localeIs('jp')) {
        return [romaji, pureName, pureAppellation, head, full];
      }
      return [pureName, pureAppellation, romaji, head, full];
    },
    transitionBeforeLeave(el) {
      const paRect = el.offsetParent?.getBoundingClientRect() ?? { top: 0, left: 0 };
      const elRect = el.getBoundingClientRect();
      this.$$(el).css({
        top: `${elRect.top - paRect.top}px`,
        left: `${elRect.left - paRect.left}px`,
        width: `${elRect.width}px`,
      });
    },
    transitionAfterLeaveBeforeEnter(el) {
      this.$$(el).css({
        top: '',
        left: '',
        width: '',
      });
    },
  },
  created() {
    // $('html').attr('l', this.locale);
    this.updatedarkTheme();
    this.updateTitle();

    darkmodejs({
      onChange: (activeTheme, { DARK }) => {
        this.systemDarkTheme = activeTheme === DARK;
      },
    });

    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      this.deferredPrompt = e;
    });

    (obj => obj && (this.setting = pickClone(this.setting, obj)))(nls.getItem('setting'));

    const lastPage = localStorage.getItem('lastPage');
    const initPath = location.hash.substr(1) || '/';
    if (this.setting.rememberLastPage && lastPage && initPath === '/' && lastPage !== '/') {
      router.replace(lastPage);
    } else if (initPath !== '/') localStorage.setItem('lastPage', initPath);

    const lang = nls.getItem('lang');
    if (lang) this.locale = langMigration[lang] || lang;

    const server = nls.getItem('server');
    if (!server) {
      this.server = this.locale;
      nls.setItem('server', this.server);
    } else this.server = server;

    // 禁止 iOS 缩放
    (() => {
      document.addEventListener(
        'touchstart',
        event => {
          if (event.touches.length > 1) {
            event.preventDefault();
          }
        },
        { passive: false },
      );
      let lastTouchEnd = 0;
      document.addEventListener(
        'touchend',
        event => {
          const now = new Date().getTime();
          if (now - lastTouchEnd <= 300) {
            event.preventDefault();
          }
          lastTouchEnd = now;
        },
        false,
      );
    })();
  },
  mounted() {
    this.screenWidth = $('body').width();
    window.onresize = () => {
      this.screenWidth = $('body').width();
    };
    $('#footer').removeClass('mdui-hidden');
    // if (this.isMobile()) $('body').attr('mobile', true);
  },
  i18n,
}).$mount('#app');
