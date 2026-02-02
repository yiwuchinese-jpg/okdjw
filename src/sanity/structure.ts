import type { StructureResolver } from 'sanity/structure'

export const structure: StructureResolver = (S) =>
    S.list()
        .id('root')
        .title('内容管理 (Content)')
        .items([
            // Articles Section
            S.listItem()
                .id('articles-menu')
                .title('文章 (Articles)')
                .child(
                    S.list()
                        .id('articles-languages')
                        .title('按语言查看')
                        .items([
                            S.listItem()
                                .id('zh-articles-item')
                                .title('中文 (ZH)')
                                .child(S.documentList().id('zh-articles-docs').title('中文文章').filter('_type == "post" && locale == "zh"')),
                            S.listItem()
                                .id('en-articles-item')
                                .title('English (EN)')
                                .child(S.documentList().id('en-articles-docs').title('English Articles').filter('_type == "post" && locale == "en"')),
                            S.listItem()
                                .id('es-articles-item')
                                .title('Español (ES)')
                                .child(S.documentList().id('es-articles-docs').title('Artículos en Español').filter('_type == "post" && locale == "es"')),
                            S.listItem()
                                .id('ru-articles-item')
                                .title('Русский (RU)')
                                .child(S.documentList().id('ru-articles-docs').title('Статьи на русском').filter('_type == "post" && locale == "ru"')),
                            S.listItem()
                                .id('ar-articles-item')
                                .title('العربية (AR)')
                                .child(S.documentList().id('ar-articles-docs').title('المقالات العربية').filter('_type == "post" && locale == "ar"')),
                            S.listItem()
                                .id('de-articles-item')
                                .title('Deutsch (DE)')
                                .child(S.documentList().id('de-articles-docs').title('Deutsche Artikel').filter('_type == "post" && locale == "de"')),
                            S.listItem()
                                .id('fr-articles-item')
                                .title('Français (FR)')
                                .child(S.documentList().id('fr-articles-docs').title('Articles en Français').filter('_type == "post" && locale == "fr"')),
                        ])
                ),

            // Resources Section
            S.listItem()
                .id('resources-menu')
                .title('资源 (Resources)')
                .child(
                    S.list()
                        .id('resources-languages')
                        .title('按语言查看')
                        .items([
                            S.listItem()
                                .id('zh-resources-item')
                                .title('中文 (ZH)')
                                .child(S.documentList().id('zh-resources-docs').title('中文资源').filter('_type == "resource" && locale == "zh"')),
                            S.listItem()
                                .id('en-resources-item')
                                .title('English (EN)')
                                .child(S.documentList().id('en-resources-docs').title('English Resources').filter('_type == "resource" && locale == "en"')),
                            S.listItem()
                                .id('es-resources-item')
                                .title('Español (ES)')
                                .child(S.documentList().id('es-resources-docs').title('Recursos en Español').filter('_type == "resource" && locale == "es"')),
                            S.listItem()
                                .id('ru-resources-item')
                                .title('Русский (RU)')
                                .child(S.documentList().id('ru-resources-docs').title('Русские ресурсы').filter('_type == "resource" && locale == "ru"')),
                            S.listItem()
                                .id('ar-resources-item')
                                .title('العربية (AR)')
                                .child(S.documentList().id('ar-resources-docs').title('الموارد العربية').filter('_type == "resource" && locale == "ar"')),
                            S.listItem()
                                .id('de-resources-item')
                                .title('Deutsch (DE)')
                                .child(S.documentList().id('de-resources-docs').title('Deutsche Ressourcen').filter('_type == "resource" && locale == "de"')),
                            S.listItem()
                                .id('fr-resources-item')
                                .title('Français (FR)')
                                .child(S.documentList().id('fr-resources-docs').title('Ressources en Français').filter('_type == "resource" && locale == "fr"')),
                        ])
                ),

            S.divider(),

            // Original lists
            ...S.documentTypeListItems().filter(
                (item) => !['post', 'resource'].includes(item.getId()!)
            ),
        ])
