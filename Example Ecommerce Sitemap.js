Evergage.init({
    cookieDomain: "northerntrailoutfitters.com"
}).then(() => {
    const config = {
        global: {
            onActionEvent: (actionEvent) => {
                const email = Evergage.util.getValueFromNestedObject("window._etmc.user_info.email");
                if (email) {
                    actionEvent.user = actionEvent.user || {};
                    actionEvent.user.attributes = actionEvent.user.attributes || {};
                    actionEvent.user.attributes.emailAddress = email;
                }
                return actionEvent;
            },
            contentZones: [
                { name: "global_infobar_top_of_page", selector: "header.site-header" },
                { name: "global_infobar_bottom_of_page", selector: "footer.site-footer" }
            ],
            listeners: [
                Evergage.listener("submit", ".email-signup", () => {
                    const email = Evergage.cashDom("#dwfrm_mcsubscribe_email").val();
                    if (email) {
                        Evergage.sendEvent({ action: "Email Sign Up - Footer", user: {attributes: {emailAddress:  email}}});
                    }
                }),
            ],
        },
        pageTypeDefault: {
            name: "default"
        },
        pageTypes: [
            {
                name: "product_detail",
                isMatch: () => {
                    return Evergage.DisplayUtils.pageElementLoaded("div.page", "html").then((ele) => {
                        const pageType = Evergage.cashDom(ele).attr("data-action");
                        return pageType === "Product-Show";
                    });
                },
                catalog: {
                    Product: {
                        _id: () => {
                            return Evergage.util.resolveWhenTrue.bind(() => {
                                const productId = Evergage.cashDom(".product-id").first().text();
                                const products = getProductsFromDataLayer();
                                if (products && products.length > 0) {
                                    return products[0].id;
                                } else if (productId) {
                                    return productId;
                                } else {
                                    return false;
                                }
                            })
                        },
                        sku: { _id: Evergage.cashDom(".product-detail[data-pid]").attr("data-pid") },
                        name: Evergage.resolvers.fromJsonLd("name"),
                        description: Evergage.resolvers.fromSelector(".short-description"),
                        url: Evergage.resolvers.fromHref(),
                        imageUrl: Evergage.resolvers.fromSelectorAttribute(".product-carousel .carousel-item[data-slick-index='0'] img", "src"),
                        inventoryCount: 1,
                        price: Evergage.resolvers.fromSelector(".prices .price .value"),
                        rating: () => {
                            return Evergage.util.extractFirstGroup(/([.\w]+) out of/, Evergage.cashDom(".ratings .sr-only").text());
                        },
                        categories: () => {
                            return Evergage.DisplayUtils.pageElementLoaded(".container .product-breadcrumb .breadcrumb a", "html").then((ele) => {
                                return Evergage.resolvers.buildCategoryId(".container .product-breadcrumb .breadcrumb a", null, null, (categoryId) => [categoryId.toUpperCase()]);
                            });
                        },
                        relatedCatalogObjects: { // In case you're using 'dimensions' instead of 'relatedCatalogObjects', you can continue to do so as they both function the same way.
                            Gender: () => {
                                return Evergage.DisplayUtils.pageElementLoaded(".product-breadcrumb .breadcrumb a, h1.product-name", "html").then((ele) => {
                                    if (Evergage.cashDom(".product-breadcrumb .breadcrumb a").first().text().toLowerCase() === "women" ||
                                        Evergage.cashDom("h1.product-name").text().indexOf("Women") >= 0) {
                                        return ["WOMEN"];
                                    } else if (Evergage.cashDom(".product-breadcrumb .breadcrumb a").first().text().toLowerCase() === "men" ||
                                        Evergage.cashDom("h1.product-name").text().indexOf("Men") >= 0) {
                                        return ["MEN"];
                                    } else {
                                        return;
                                    }
                                });
                            },
                            Color: () => {
                                return Evergage.DisplayUtils.pageElementLoaded(".attributes", "html").then((ele) => {
                                    return Evergage.resolvers.fromSelectorAttributeMultiple(".color-value", "data-attr-value");
                                });
                            },
                            Feature: () => {
                                return Evergage.DisplayUtils.pageElementLoaded(".features", "html").then((ele) => {
                                    return Evergage.resolvers.fromSelectorMultiple(".features .feature", (features) => {
                                        return features.map((feature) => {
                                            return feature.trim();
                                        });
                                    });
                                });
                            }
                        }
                    }
                },
                contentZones: [
                    { name: "product_detail_recs_row_1", selector: ".row.recommendations div[id*='cq']:nth-of-type(1)" },
                    { name: "product_detail_recs_row_2", selector: ".row.recommendations div[id*='cq']:nth-of-type(2)" },
                    { name: "testHeader", selector: ".site-header"},
                ],
                listeners: [
                    Evergage.listener("click", ".add-to-cart", () => {
                        const lineItem = Evergage.util.buildLineItemFromPageState("select[id*=quantity]");
                        lineItem.sku = { _id: Evergage.cashDom(".product-detail[data-pid]").attr("data-pid") };
                        Evergage.sendEvent({
                            itemAction: Evergage.ItemAction.AddToCart,
                            cart: {
                                singleLine: {
                                    Product: lineItem
                                }
                            }
                        });
                    }),
                    Evergage.listener("click", ".attribute", (event) => {
                        let classList = event.target.classList.value.split(" ");
                        if (classList.includes("color-value") || classList.includes("size-value")) {
                            Evergage.sendEvent({
                                itemAction: Evergage.ItemAction.ViewItemDetail,
                                catalog: {
                                    Product: {
                                        _id: Evergage.util.buildLineItemFromPageState("select[id*=quantity]")._id,
                                        sku: { _id: Evergage.cashDom(".product-detail[data-pid]").attr("data-pid") },
                                        relatedCatalogObjects: {
                                            Color: [Evergage.cashDom(".color-value.selected").attr("data-attr-value")]
                                        }
                                    }
                                }                                
                            });
                        }
                    })
                ],
            },
            {
                name: "Category",
                action: "Viewed Category",
                isMatch: () => {
                    return Evergage.DisplayUtils.pageElementLoaded(".page", "html").then((ele) => {
                        const pageType = Evergage.cashDom(ele).attr("data-action");
                        return pageType === "Search-Show" && Evergage.cashDom(".breadcrumb").length > 0;
                    });
                },
                catalog: {
                    Category: {
                        _id: () => {
                            return Evergage.DisplayUtils.pageElementLoaded(".breadcrumb .breadcrumb-item a", "html").then((ele) => {
                                return Evergage.resolvers.buildCategoryId(".breadcrumb .breadcrumb-item a", 1, null, (categoryId) => categoryId.toUpperCase());
                            });
                        }
                    }
                },
                listeners: [
                    Evergage.listener("click", ".quickview", (e) => {
                        const pid = Evergage.cashDom(e.target).attr("href").split("pid=")[1];
                        if (!pid) {
                            return;
                        }
        
                        Evergage.sendEvent({
                            action: "Category Page Quick View",
                            itemAction: Evergage.ItemAction.QuickViewItem,
                            catalog: {
                                Product: {
                                    _id: pid
                                }
                            }
                        });
                    }),
                    Evergage.listener("click", "body", (e) => {
                        if (Evergage.cashDom(e.target).closest("button[data-dismiss='modal']").length > 0) {
                            Evergage.sendEvent({
                                action: "Close Quick View",
                                itemAction: Evergage.ItemAction.StopQuickViewItem,
                            });
                        } else if (Evergage.cashDom(e.target).closest("#quickViewModal").length > 0 && Evergage.cashDom(e.target).find("#quickViewModal .modal-dialog").length > 0) {
                            Evergage.sendEvent({
                                action: "Close Quick View",
                                itemAction: Evergage.ItemAction.StopQuickViewItem,
                            });
                        }
                    })
                ]
            },
            {
                name: "department",
                isMatch: () => {
                    return Evergage.DisplayUtils.pageElementLoaded("div.category-tile", "html").then((ele) => {
                        return !/\/homepage/.test(window.location.href);    
                    });
                }
            },
            {
                name: "search_results",
                isMatch: () => /\/default\/search$/.test(window.location.pathname)
            },
            {
                name: "cart",
                isMatch: () => /\/cart/.test(window.location.href),
                itemAction: Evergage.ItemAction.ViewCart,
                catalog: {
                    Product: {
                        lineItems: {
                            _id: () => {
                                return Evergage.DisplayUtils.pageElementLoaded(".cart-empty, .checkout-btn", "html").then((ele) => {
                                    return Evergage.resolvers.fromSelectorAttributeMultiple(".product-info .product-details .line-item-quantity-info", "data-pid")
                                })
                            },
                            price: () => {
                                return Evergage.DisplayUtils.pageElementLoaded(".cart-empty, .checkout-btn", "html").then((ele) => {
                                    return Evergage.resolvers.fromSelectorMultiple(".product-info .product-details .pricing");
                                })
                            },
                            quantity: () => {
                                return Evergage.DisplayUtils.pageElementLoaded('.cart-empty, .checkout-btn', "html").then((ele) => {
                                    return Evergage.resolvers.fromSelectorMultiple(".product-info .product-details .qty-card-quantity-count");
                                });
                            },
                        }
                    }
                }
            },
            {
                name: "order_confirmation",
                isMatch: () => /\/confirmation/.test(window.location.href),
                itemAction: Evergage.ItemAction.Purchase,
                catalog: {
                    Product: {
                        orderId: () => {
                            return Evergage.DisplayUtils.pageElementLoaded(".order-number", "html").then((ele) => {
                                return Evergage.resolvers.fromSelector(".order-number");
                            });
                        },
                        lineItems: {
                            _id: () => {
                                return Evergage.DisplayUtils.pageElementLoaded(".product-line-item line-item-quantity-info", "html").then((ele) => {
                                    return Evergage.resolvers.fromSelectorAttributeMultiple(".product-line-item .line-item-quantity-info", "data-pid");
                                });
                            },
                            price:  () => {
                                return Evergage.DisplayUtils.pageElementLoaded(".product-line-item .pricing", "html").then((ele) => {
                                    return Evergage.resolvers.fromSelectorAttributeMultiple(".product-line-item .pricing", "data-pid");
                                });
                            },
                            quantity:  () => {
                                return Evergage.DisplayUtils.pageElementLoaded(".product-line-item .qty-card-quantity-count", "html").then((ele) => {
                                    return Evergage.resolvers.fromSelectorAttributeMultiple(".product-line-item .qty-card-quantity-count", "data-pid");
                                });
                            },
                        }
                    }
                }
            },
            {
                name: "login",
                action: "Login",
                isMatch: () => /\/login/.test(window.location.href) && window.location.hostname !== "community.northerntrailoutfitters.com",
                listeners: [
                    Evergage.listener("click", "form[name='login-form'] button", () => {
                        const email = Evergage.cashDom("#login-form-email").val();
                        if (email) {
                            Evergage.sendEvent({ action: "Logged In",  user: {attributes: {emailAddress:  email}}});
                        }
                    })
                ]
            },
            {
                name: "home",
                action: "Homepage",
                isMatch: () => /\/homepage/.test(window.location.href),
                contentZones: [
                    { name: "home_hero", selector: ".experience-carousel-bannerCarousel" },
                    { name: "home_sub_hero", selector: ".experience-carousel-bannerCarousel + .experience-component" },
                    { name: "home_popup" }
                ]
            },
            {
                name: "community_login",
                action: "Community Login",
                isMatch: () => window.location.hostname === "community.northerntrailoutfitters.com" && /\/s\/login/.test(window.location.href),
                listeners: [
                    Evergage.listener("click", ".loginButton", event => {
                        const email = Evergage.cashDom("input[placeholder='Email']").val();
                        if (email) {
                            Evergage.sendEvent({ action: "Community Log In", user: {attributes: {emailAddress:  email}}});
                        }
                    })
                ]
            },
            {
                name: "community_home",
                action: "Community Homepage",
                isMatch: () => {
                    return window.location.hostname === "community.northerntrailoutfitters.com" && /^\/s\/?$/.test(window.location.pathname);
                },
                listeners: [
                    Evergage.listener("click", "li.topicItem", (event) => {
                        const topicLabel = Evergage.cashDom(event.currentTarget).find(".topicLabel").text().trim();
                        if (topicLabel) {
                            Evergage.sendEvent({ action: "Community Homepage - " + topicLabel });
                        }
                    })
                ]
            }
        ]
    };
    const getProductsFromDataLayer = () => {
        if (window.dataLayer) {
            for (let i = 0; i < window.dataLayer.length; i++) {
                if ((window.dataLayer[i].ecommerce && window.dataLayer[i].ecommerce.detail || {}).products) {
                    return window.dataLayer[i].ecommerce.detail.products;
                }
            }
        }
    };
    Evergage.initSitemap(config);
});