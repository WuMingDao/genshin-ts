import { defineConfig } from "rspress/config";
import pluginSitemap from "rspress-plugin-sitemap";
import { pluginOpenGraph } from "rsbuild-plugin-open-graph";

const siteUrl = "https://gsts.moe";

export default defineConfig({
  root: "docs",
  title: "Genshin-TS",
  description: "Use Typescript to develop Genshin UGC - Miliastra Wonderland",
  lang: "en",
  icon: "/rspress-icon.png",
  logo: "/rspress-icon.png",
  logoText: "Genshin-TS",
  markdown: {
    checkDeadLinks: true,
  },
  ssg: {
    strict: true,
  },
  plugins: [
    pluginSitemap({
      domain: siteUrl,
    }),
  ],
  builderConfig: {
    html: {
      tags: [
        {
          tag: "script",
          // 通过 window.RSPRESS_THEME 变量来指定默认的主题模式，可选值为 'dark' 和 'light'
          children: "window.RSPRESS_THEME = 'dark';",
        },
      ],
    },
    plugins: [
      pluginOpenGraph({
        title: "Genshin-TS",
        type: "website",
        url: siteUrl,
        description:
          "Use Typescript to develop Genshin UGC - Miliastra Wonderland",
        twitter: undefined,
      }),
    ],
  },
  search: {
    codeBlocks: true,
  },
  themeConfig: {
    darkMode: false,
    socialLinks: [
      {
        icon: "github",
        mode: "link",
        content: "https://github.com/josStorer/genshin-ts",
      },
    ],
    locales: [
      {
        lang: "en",
        label: "English",
      },
      {
        lang: "zh",
        label: "简体中文",
        searchNoResultsText: "未搜索到相关结果",
        searchPlaceholderText: "搜索文档",
        searchSuggestedQueryText: "可更换不同的关键字后重试",
        nextPageText: "下一页",
        prevPageText: "上一页",
        outlineTitle: "目录",
      },
    ],
  },
});
