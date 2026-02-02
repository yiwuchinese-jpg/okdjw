import type { StructureResolver } from 'sanity/structure'

export const structure: StructureResolver = (S) =>
    S.list()
        .title('内容管理 (Content)')
        .items([
            // Articles Section
            S.listItem()
                .title('文章 (Articles)')
                .child(
                    S.list()
                        .id('articles')
                        .title('按语言查看')
                        .items([
                            S.listItem()
                                .title('中文 (ZH)')
                                .child(S.documentList().id('zh-articles').title('中文文章').filter('_type == "post" && locale == "zh"')),
                            S.listItem()
                                .title('English (EN)')
                                .child(S.documentList().id('en-articles').title('English Articles').filter('_type == "post" && locale == "en"')),
                            S.listItem()
                                .title('Español (ES)')
                                .child(S.documentList().id('es-articles').title('Artículos en Español').filter('_type == "post" && locale == "es"')),
                            S.listItem()
                                .title('Русский (RU)')
                                .child(S.documentList().id('ru-articles').title('Статьи на русском').filter('_type == "post" && locale == "ru"')),
                            S.listItem()
                                .title('العربية (AR)')
                                .child(S.documentList().id('ar-articles').title('المقالات العربية').filter('_type == "post" && locale == "ar"')),
                            S.listItem()
                                .title('Deutsch (DE)')
                                .child(S.documentList().id('de-articles').title('Deutsche Artikel').filter('_type == "post" && locale == "de"')),
                            S.listItem()
                                .title('Français (FR)')
                                .child(S.documentList().id('fr-articles').title('Articles en Français').filter('_type == "post" && locale == "fr"')),
                        ])
                ),

            // Resources Section
            S.listItem()
                .title('资源 (Resources)')
                .child(
                    S.list()
                        .id('resources')
                        .title('按语言查看')
                        .items([
                            S.listItem()
                                .title('中文 (ZH)')
                                .child(S.documentList().id('zh-resources').title('中文资源').filter('_type == "resource" && locale == "zh"')),
                            S.listItem()
                                .title('English (EN)')
                                .child(S.documentList().id('en-resources').title('English Resources').filter('_type == "resource" && locale == "en"')),
                            S.listItem()
                                .title('Español (ES)')
                                .child(S.documentList().id('es-resources').title('Recursos en Español').filter('_type == "resource" && locale == "es"')),
                            S.listItem()
                                .title('Русский (RU)')
                                .child(S.documentList().id('ru-resources').title('Русские ресурсы').filter('_type == "resource" && locale == "ru"')),
                            S.listItem()
                                .title('العربية (AR)')
                                .child(S.documentList().id('ar-resources').title('الموارد العربية').filter('_type == "resource" && locale == "ar"')),
                            S.listItem()
                                .title('Deutsch (DE)')
                                .child(S.documentList().id('de-resources').title('Deutsche Ressourcen').filter('_type == "resource" && locale == "de"')),
                            S.listItem()
                                .title('Français (FR)')
                                .child(S.documentList().id('fr-resources').title('Ressources en Français').filter('_type == "resource" && locale == "fr"')),
                        ])
                ),

            S.divider(),

            // Original lists for easy access (optional)
            ...S.documentTypeListItems().filter(
                (item) => !['post', 'resource'].includes(item.getId()!)
            ),
        ])
