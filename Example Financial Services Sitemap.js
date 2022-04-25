Evergage.init().then(() => {
    const config = {
        global: {},
        pageTypes: [
            {
                name: "home",
                action: "Homepage",
                isMatch: () => /^\/$/.test(window.location.pathname),
                contentZones: [
                    {name: "home_hero", selector: ".hero-inner"},
                    {name: "home_recommendations", selector: ".intro-content"},
                    {name: "home_nav",selector: "body > div.category-menu"},
                ]
            },
            {
                name: "product_detail",
                isMatch: () => Evergage.cashDom("div.container.product-intro").length > 0,
                action: "View Product",
                catalog: {
                    Product: {
                        _id: Evergage.resolvers.fromHref((url) => url.split("/").splice(-1)[0].toUpperCase()),
                        name: Evergage.resolvers.fromSelector("h1"),
                        price: 1,
                        url: Evergage.resolvers.fromHref(),
                        imageUrl: Evergage.resolvers.fromSelectorAttribute(".img-responsive", "src"),
                        inventoryCount: 1,
                        categories: Evergage.resolvers.buildCategoryId(".nav a.current span", null, null, (id) => {
                            return [id];
                        }),
                        relatedCatalogObjects: { // In case you're using 'dimensions' instead of 'relatedCatalogObjects', you can continue to do so as they both function the same way.
                            ItemClass: Evergage.resolvers.fromSelectorMultiple("li.current a")
                        }
                    }
                },
                listeners: [
                    Evergage.listener("click", ".product-intro .btn.green-btn.btn-med", (event) => {
                        Evergage.sendEvent({
                            itemAction: Evergage.ItemAction.AddToCart,
                            cart: {
                                singleLine: {
                                    Product: {
                                        _id: Evergage.util.getPathname(window.location.href).split("/").splice(-1)[0].toUpperCase(),
                                        price: 1,
                                        quantity: 1
                                    }
                                }
                            }
                        })
                    })
                ],
                contentZones: [
                    { name: "product_detail_cta", selector: ".btn.green-btn.btn-med" }
                ]
            },
            {
                name: "pre_approved",
                isMatch: () => /\/get-preapproved/.test(window.location.href),
                action: "Pre-Approved",
                listeners: [
                    Evergage.listener("click", "#msform", (event) => {
                        if (Evergage.cashDom(event.target).closest(".next").length > 0) {
                            const step = Evergage.cashDom("#progressbar .active").length - 1;
                            if (step > 0) {
                                const email = Evergage.cashDom("#form-application-email").val();
                                let actionEvent = {
                                    user: {},
                                    action: "Get Pre-Approved Form Step " + step + " Submit"
                                };
                                if (email) {
                                    actionEvent.user.id = email;
                                }
                                Evergage.sendEvent(actionEvent);
                            }
                        }
                        else if (Evergage.cashDom(event.target).closest(".save").length > 0) {
                            const step = Evergage.cashDom("#progressbar .active").length;
                            if (step > 0) {
                                const email = Evergage.cashDom("#form-application-email").val();
                                let actionEvent = {
                                    user: {
                                        attributes: {LifecycleState: "Mortgage Application Open"}
                                    },
                                    action: "Get Pre-Approved Form Step " + step + " Save For Later"
                                };
                                if (email) {
                                    actionEvent.user.id = email;
                                }
                                Evergage.sendEvent(actionEvent);
                            }
                        }
                    })
                ]
            }
        ]
    };

    Evergage.initSitemap(config);
});