Evergage.init({
    cookieDomain: "tableau.com"
}).then(() => {

    const findInDataLayer = (targetAttribute) => {
        if (!window.dataLayer) {
            return;
        }
        for (let i = 0; i < window.dataLayer.length; i++) {
            const result = Evergage.util.getValueFromNestedObject("window.dataLayer[" + i + "]");
            if (result && result[targetAttribute]) {
                return result;
            }
        }
        return;
    };

    // We set a value for this variable only once per page load and then reference it several times for the data found in the dataLayer needed for each page.
    let pageDetails;
    const setPageDetailsFromDataLayer = () => {
        pageDetails = pageDetails || findInDataLayer("entityId");
    };

    /* 
    Here we will first check session storage for the islogin item containing the user's email that is associated with
    their account. This value is set in the global event listener in the site config when a submission event occurs. On this 
    website, both successful and invalid form submissions emit a submission event, the page also is quickly reloaded
    after a successful login. 
    In this unusual situation, we will first save the submitted data in session storage. Then when the page loads, 
    we check for the islogin value in session storage and then look for a DOM element which indicates a successful
    login before retrieving the stored user email and sending our login event.
    */
    let loginEvent = sessionStorage.getItem('islogin');
    // if there is a stored login event...
    if (loginEvent) {
        // wait for the logged in user dropdown to appear in the nav, signifying a successful login
        Evergage.DisplayUtils.pageElementLoaded("#block-public-sitewide-ui-author-profile-dropdown")
        .then(() => {
            // remove the stored email from session storage
            sessionStorage.removeItem('islogin');
            // construct and send the Login Success event to Interaction Studio
            Evergage.sendEvent({
                    action: "Login Success",
                    user: {
                        /*
                        The users email address provided in the login form is sent to Interaction Studio as user.id because
                        in this example, emailAddress is configured to be the default identity for the web channel. 
                        */
                        id: loginEvent
                    }
                });
        });
    }

    const config = {
        global: {
            contentZones: [
                { name: "global_popup" },
                { name: "global_infobar" },
                { name: "global_exit_intent"},
                /*
                Since the website does not have consistent selectors and structure within the Article pages,
                this content zone will be used to add recs to the bottom of Article pages.
                */
                { name: "global_footer", selector: "footer.global-footer" }
            ],
            listeners: [
                /*
                Here we are listening for all submission events that happen within this document. This pattern
                can be used to create generic form submission event handlers, or even just to consolidate them
                to one place in the sitemap code.
                */
                Evergage.listener("submit", document, (event) => {
                    // Check the id of the event target to check for the login form we want to scrape data from
                    if (event.target.id === "login-form") {
                        // loop through login form fields...
                        for (i = 0; i < event.target.length; i++) {
                            // Find the email field by id within the event object.
                            if (event.target[i].id === "login-email") {
                                // save user email in session storage
                                sessionStorage.setItem('islogin', event.target[i].value);
                            }
                        }
                    }
                }),
            ],
        },
        pageTypeDefault: {
            name: "default"
        },
        pageTypes: [
            {
                name: "home",
                action: "Homepage",
                isMatch: () => /^\/$/.test(window.location.pathname),
                contentZones: [
                    { name: "home_recs_1", selector: "section.datalocation-audience-segment-links" },
                    { name: "home_recs_2", selector: "section.datalocation-customer-stories" },
                ]
            },
            {
                name: "products_landing",
                action: "Products Landing",
                isMatch: () => /^\/products\/?$/.test(window.location.pathname),
                catalog: {
                    Category: {
                        /*
                        Remember, Catalog IDs are case sensitive. Transforming collected values as all upper case or all lower 
                        case is a common method for ensuring consistency throughout the site when creating Catalog IDs with the
                        sitemap which do not need to correspond to data in external systems.
                        */
                        _id: () => Evergage.util.getLastPathComponentWithoutExtension(window.location.pathname).toLowerCase(),
                        url: Evergage.resolvers.fromCanonical(),
                        name: Evergage.resolvers.fromMeta("og:title")
                    }
                },
                contentZones: [
                    { name: "products_landing_hero_banner", selector: "#hero" }
                ]
            },
            {
                name: "solutions_landing",
                action: "Solutions Landing",
                isMatch: () => /^\/solutions\/?(customers|industries|departments|technologies)?$/.test(window.location.pathname),
                catalog: {
                    Category: {
                        /* 
                        The last parameter of each resolver function accepts a function which returns whatever the desired final value is.
                        This is very useful when you need to transform or sanitize a scraped value before sending it to Interaction studio. 

                        You can learn more about resolver functions here: https://developer.evergage.com/web-integration/sitemap/sitemap-implementation-notes#resolvers
                        
                        Below, the pathname portion of the URL is transformed into a hierarchal Category id.
                        */
                        _id: Evergage.resolvers.fromWindow("location.pathname", (path) => path.split('/').slice(1).join('|').toLowerCase()),
                        url: Evergage.resolvers.fromCanonical(),
                        name: Evergage.resolvers.fromMeta("og:title")
                    }
                },
                contentZones: [
                    { name: "solutions_landing_hero_banner", selector: "#hero" }
                ]
            },
            {
                name: "learning_landing",
                action: "Learning Landing",
                isMatch: () => /^\/learn\/?$/.test(window.location.pathname),
                catalog: {
                    Category: {
                        _id: () => Evergage.util.getLastPathComponentWithoutExtension(window.location.pathname).toLowerCase(),
                        url: Evergage.resolvers.fromCanonical(),
                        name: Evergage.resolvers.fromMeta("og:title")
                    }
                },
                contentZones: [
                    { name: "learning_landing_gray_recs", selector: ".entity-paragraphs-item.paragraph--type--cross-reference" },
                    { name: "learning_landing_hero_banner", selector: "#hero" }
                ]
            },
            {
                name: "blog_landing",
                action: "Blog Landing",
                isMatch: () => /^\/about\/blog\/?$/.test(window.location.pathname),
                catalog: {
                    Category: {
                        _id: () => Evergage.util.getLastPathComponentWithoutExtension(window.location.pathname).toLowerCase(),
                        url: Evergage.resolvers.fromCanonical(),
                        name: Evergage.resolvers.fromMeta("og:title")
                    }
                },
                contentZones: [
                    { name: "blog_landing_card_wall", selector: ".card-wall" },
                    { name: "blog_landing_hero_banner", selector: "#hero" }
                ]
            },
            {
                name: "product",
                action: "Product",
                isMatch: () => {
                    if (/^\/products\//.test(window.location.pathname)) {
                        /* 
                        We only want to call setPageDetailsFromDataLayer() when pages which rely on scraping information from the dataLayer are actually matched.
                        Adding a conditional statement prevents this function from being called on every page on the site as Interaction Studio resolves every
                        isMatch function to see which page type matches the current one.
                        */
                        setPageDetailsFromDataLayer();
                        return true;
                    }
                    return false;
                },
                catalog: {
                    /*
                    Remember, while this site does promote products, there is no ability to purchase products or attribute
                    revenue to them from other channels which would match with user activity from the web.
                    Since the special capabilities of the Product item type will not be needed for this implementation,
                    we will instead use the Article item type, utilizing Category to tell types of Article apart.
                    */
                    Article: {
                        /*
                        We are using Evergage.util.getValueFromNestedObject() to more easily reference data from the pageDetails
                        object after the value is set when the page matches.
                        */
                        _id: () => Evergage.util.getValueFromNestedObject("entityId", pageDetails),
                        name: () => Evergage.util.getValueFromNestedObject("entityLabel", pageDetails),
                        url: Evergage.resolvers.fromCanonical(),
                        imageUrl: Evergage.resolvers.fromSelectorAttribute("div.feature-highlight__image img", "src"),
                        categories: Evergage.resolvers.fromWindow("location.pathname", (path) => {
                            const categories = path.split('/').slice(1);
                            categories.pop();
                            if (categories.length === 0) {
                                const dataLayerCategories = Evergage.util.getValueFromNestedObject("page.category1", pageDetails);
                                return dataLayerCategories ? [dataLayerCategories.toLowerCase()] : [];
                            } 
                            return [categories.join('|').toLowerCase()];
                        }),
                        relatedCatalogObjects: { // In case you're using 'dimensions' instead of 'relatedCatalogObjects', you can continue to do so as they both function the same way. 
                            ProductType: () => window.location.pathname.indexOf("add-ons") > -1 ? ["Add-On"] : ["Software"],
                            Industry: () => (Evergage.util.getValueFromNestedObject("dataModelFields.field_dmo_industries", pageDetails) || null),
                            Department: () => (Evergage.util.getValueFromNestedObject("dataModelFields.field_departments", pageDetails) || null),
                            JobRole: () => (Evergage.util.getValueFromNestedObject("dataModelFields.taxonomy_vocabulary_23", pageDetails) || null),
                            PageBundle: () => {
                                const pageBundle = Evergage.util.getValueFromNestedObject("entityBundleNice", pageDetails);
                                return pageBundle ? [pageBundle] : null;
                            },
                            Keyword: Evergage.resolvers.fromMeta("keywords", (ele) => {
                                return ele ? ele.split(/\,\s*/) : null;
                            })
                        }
                    }
                },
                listeners: [
                    Evergage.listener("submit", "#webform-submission-email-embeddable-1-add-form", (event) => {
                        Evergage.sendEvent({
                            action: "Free Trial Download",
                            /*
                            A content zone is provided in this event in order to allow a campaign targeting the "global_infobar"
                            content zone to be returned in the response sent back from Interaction Studio with this request.
                            */
                            source:{
                                contentZones: ["global_infobar"]
                            }
                        });
                    })
                ]
            },
            {
                name: "solutions",
                action: "Solutions",
                isMatch: () => {
                    if (/\/solutions\/(?!customers|industries|departments|technologies)/.test(window.location.pathname)) {
                        setPageDetailsFromDataLayer();
                        return true;
                    }
                    return false;
                },
                catalog: {
                    Article: {
                        _id: () => Evergage.util.getValueFromNestedObject("entityId", pageDetails),
                        name: () => Evergage.util.getValueFromNestedObject("entityLabel", pageDetails),
                        url: Evergage.resolvers.fromCanonical(),
                        imageUrl: Evergage.resolvers.fromSelectorAttribute("div.feature-highlight__image img", "src"),
                        categories: Evergage.resolvers.fromWindow("location.pathname", (path) => {
                            const categories = path.split('/').slice(1);
                            categories.pop();
                            return [categories.join('|').toLowerCase()];
                        }),
                      relatedCatalogObjects: {
                            Industry: () => (Evergage.util.getValueFromNestedObject("dataModelFields.field_dmo_industries", pageDetails) || null),
                            Department: () => (Evergage.util.getValueFromNestedObject("dataModelFields.field_departments", pageDetails) || null),
                            JobRole: () => (Evergage.util.getValueFromNestedObject("dataModelFields.taxonomy_vocabulary_23", pageDetails) || null),
                            PageBundle: () => {
                                const pageBundle = Evergage.util.getValueFromNestedObject("entityBundleNice", pageDetails);
                                return pageBundle ? [pageBundle] : null;
                            }
                        },
                    }
                }
            },
            {
                name: "learning",
                action: "Learning",
                isMatch: () => {
                    if (/^\/learn\//.test(window.location.pathname)) {
                        setPageDetailsFromDataLayer();
                        return true;
                    }
                    return false;
                },
                catalog: {
                    Article: {
                        _id: () => Evergage.util.getValueFromNestedObject("entityId", pageDetails),
                        name: () => Evergage.util.getValueFromNestedObject("entityLabel", pageDetails),
                        url: Evergage.resolvers.fromCanonical(),
                        imageUrl: Evergage.resolvers.fromSelectorAttribute("div.feature-highlight__image img", "src"),
                        categories: Evergage.resolvers.fromWindow("location.pathname", (path) => {
                            const categories = path.split('/').slice(1);
                            categories.pop();
                            return [categories.join('|').toLowerCase()];
                        }),
                      relatedCatalogObjects: {
                            Industry: () => (Evergage.util.getValueFromNestedObject("dataModelFields.field_dmo_industries", pageDetails) || null),
                            Department: () => (Evergage.util.getValueFromNestedObject("dataModelFields.field_departments", pageDetails) || null),
                            JobRole: () => (Evergage.util.getValueFromNestedObject("dataModelFields.taxonomy_vocabulary_23", pageDetails) || null),
                            PageBundle: () => {
                                const pageBundle = Evergage.util.getValueFromNestedObject("entityBundleNice", pageDetails);
                                return pageBundle ? [pageBundle] : null;
                            }
                        }
                    }
                }
            },
            {
                name: "blog",
                isMatch: () => {
                    if (/\/about\/blog\/\d+\/\d+\/.+/.test(window.location.pathname)) {
                        setPageDetailsFromDataLayer();
                        return true;
                    }
                    return false;
                },
                catalog: {
                    Blog: {
                        _id: () => Evergage.util.getValueFromNestedObject("entityId", pageDetails),
                        name: () => Evergage.util.getValueFromNestedObject("entityLabel", pageDetails),
                        url: Evergage.resolvers.fromCanonical(),
                        imageUrl: Evergage.resolvers.fromMeta("og:image"),
                        categories: () => [Evergage.util.getValueFromNestedObject("flatTaxonomy.blog_categories", pageDetails)]
                    }
                },
                listeners: [
                    Evergage.listener("submit", ".premium-access-ajax", () => {
                        const eloquaId = findInDataLayer("EloquaGuid");
                        if (eloquaId) {
                            Evergage.sendEvent({action: "Tableau Blog Sign-up", user: {attributes: {eloquaId: eloquaId}}});
                        }
                    }),
                ],
                contentZones: [
                    /*
                    As in this case below, content zones do not necessarily have to denote content to be replaced, they can be
                    useful for inserting template content before or after the the DOM node with the provided selector.
                    */
                    { name: "blog_text_content", selector: ".field--name-field-page-sections" }
                ]
            }
        ]
    }
    Evergage.initSitemap(config);
});