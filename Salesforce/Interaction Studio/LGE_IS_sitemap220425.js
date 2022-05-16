Evergage.init({    // Initializes the Interaction Studio Web SDK
	cookieDomain: "lg.com"    // Optional tracking cookie domain configuration (overrides default)
}).then(() => {

	// Sitemap configuration object
	const sitemapConfig = {
		// Object used to contain Global site object configuration
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
				{ name: "global_Header", selector: "div.row.for-desktop" },
				{ name: "메인페이지 인포바", selector: "div.gnb-standard-banner-wrap" }
				//{ name: "global_infobar_bottom", selector: "footer.site-footer" }
			],
		},
		// Array used to contain the page type object configurations
		pageTypeDefault: {
			name: "default"
		},
		pageTypes: [
			{
				name: "제품 상세 페이지",
				isMatch: () => Evergage.cashDom("div.pdp-summary-area").length > 0,
				action: "View Product",
				catalog: {
					Product: {
						//_id: Evergage.resolvers.fromHref((url) => url.split("/").splice(-1)[0]),
						_id: Evergage.resolvers.fromSelector(".model-name"),
						name: Evergage.resolvers.fromSelector(".model-name"),
						Category: {
							_id: Evergage.resolvers.buildCategoryId(".breadcrumb .breadcrumb-item a", 1, null, (categoryId) => categoryId.toUpperCase())
						},
						url: Evergage.resolvers.fromHref(),
						imageUrl: Evergage.resolvers.fromSelectorAttribute("#base_detail_target", "src"),
						//imageUrl2: Evergage.resolvers.fromSelectorAttribute(".product-carousel .carousel-item[data-slick-index='0'] img", "src"),
						price: Evergage.resolvers.fromSelector(".price"),
					}
				},
				contentZones: [
					{ name: "온라인매장", selector: ".find-online" },
					{ name: "AddToCompare", selector: "#iw_comp1552369748849" },
					//{ name: "product_detail_recs_row_2", selector: ".row.recommendations div[id*='cq']:nth-of-type(2)" },
					//{ name: "product_detail_popup" },
				],
				listeners: [ // added in this step
					/* Typical functions related to capture
						* listener : Functions that capture customer behavior, such as click and submit（Dynamic Information）
						* resolvers : Functions that collect from a DOM selector such as web contents, catalog product information（Static Information）
						* cashDom : Functions that collect information from the DOM cache */
					//AddToCompare
					Evergage.listener("click", ".wishlist-compare", () => {
						const lineItem = Evergage.resolvers.fromSelector(".model-name");
						lineItem.sku = { _id: Evergage.resolvers.fromSelector(".model-name") };
						Evergage.sendEvent({
							/*the difference of “action” and “item Action”
							* Depending on whether the behavior is linked to the catalog or not, The way to be used will be varied.
							* Always insert for tracking
							* Always Insert both “action” and “item Action” to collect actions if the actions are linked to catalogs

							 action：users actions such as click or submit
							 itemAction：default actions to be linked to catalog such as Purchase, AddToCart or Search */
							itemAction: Evergage.ItemAction.AddToCompare,
							cart: {
								singleLine: {
									Product: lineItem
								}
							}
						});
					}),
					//AddToCart
					Evergage.listener("click", ".add-to-cart", () => {
						const lineItem = Evergage.resolvers.fromSelector(".model-name");
						lineItem.sku = { _id: Evergage.resolvers.fromSelector(".model-name") };
						Evergage.sendEvent({
							itemAction: Evergage.ItemAction.AddToCart,
							cart: {
								singleLine: {
									Product: lineItem
								}
							}
						});
					}),
				]
			},

		]
	}
	// Initializes the Sitemap
	Evergage.initSitemap(sitemapConfig);
});
