import type { Schema, Attribute } from '@strapi/strapi';

export interface YoutubeVideo extends Schema.Component {
  collectionName: 'components_youtube_videos';
  info: {
    displayName: 'video';
    icon: 'play';
  };
  attributes: {
    link_source: Attribute.String & Attribute.Required;
    title: Attribute.String & Attribute.Required;
  };
}

export interface WeightWeight extends Schema.Component {
  collectionName: 'components_weight_weights';
  info: {
    displayName: 'weight';
    icon: 'archive';
    description: '';
  };
  attributes: {
    enable_maximum_weight_fee_for_standard_shipping_in_grams: Attribute.Boolean &
      Attribute.Required &
      Attribute.DefaultTo<false>;
    maximum_weight_for_standard_shipping_in_grams: Attribute.Integer &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Attribute.DefaultTo<0>;
    volumetric_weight_applied_if_needed: Attribute.Boolean &
      Attribute.Required &
      Attribute.DefaultTo<false>;
    volumetric_weight_applied_if_needed_in_grams: Attribute.Integer &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Attribute.DefaultTo<0>;
    fixed_extra_fee_per_increment: Attribute.Decimal &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Attribute.DefaultTo<0>;
    weight_increment_for_fixed_fee_in_grams: Attribute.Decimal &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Attribute.DefaultTo<0>;
    VAT: Attribute.Decimal &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Attribute.DefaultTo<0>;
    apply_difference_based_fee: Attribute.Boolean &
      Attribute.Required &
      Attribute.DefaultTo<true>;
  };
}

export interface SocialButtonsSocialLink extends Schema.Component {
  collectionName: 'components_social_buttons_social_links';
  info: {
    displayName: 'social-link';
    icon: 'link';
  };
  attributes: {};
}

export interface ShippingDeliveryZoneShippingDeliveryZone
  extends Schema.Component {
  collectionName: 'components_shipping_delivery_zone_shipping_delivery_zones';
  info: {
    displayName: 'shipping-delivery-zone';
    icon: 'car';
    description: '';
  };
  attributes: {
    zone_name_in_arabic: Attribute.String & Attribute.Required;
    zone_name_in_english: Attribute.String & Attribute.Required;
    minimum_delivery_duration_in_days: Attribute.Decimal &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Attribute.DefaultTo<0>;
    maximum_delivery_duration_in_days: Attribute.Decimal &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Attribute.DefaultTo<0>;
  };
}

export interface SharedSeo extends Schema.Component {
  collectionName: 'components_shared_seos';
  info: {
    displayName: 'seo';
    icon: 'search';
    description: '';
  };
  attributes: {
    metaTitle: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 60;
      }>;
    metaDescription: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 50;
        maxLength: 160;
      }>;
    keywords: Attribute.Text;
  };
}

export interface SharedMetaSocial extends Schema.Component {
  collectionName: 'components_shared_meta_socials';
  info: {
    displayName: 'metaSocial';
    icon: 'project-diagram';
  };
  attributes: {
    socialNetwork: Attribute.Enumeration<['Facebook', 'Twitter']> &
      Attribute.Required;
    title: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 60;
      }>;
    description: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 65;
      }>;
    image: Attribute.Media<'images' | 'files' | 'videos'>;
  };
}

export interface ReportAbuseReportAbuse extends Schema.Component {
  collectionName: 'components_report_abuse_report_abuses';
  info: {
    displayName: 'report_abuse';
    icon: 'discuss';
    description: '';
  };
  attributes: {
    resolved: Attribute.Boolean & Attribute.DefaultTo<false>;
    resolved_comment___users_can_not_see_this_comment: Attribute.Text;
    issue_type: Attribute.Enumeration<
      ['off topic', 'inappropriate', 'fake', 'other']
    > &
      Attribute.Required &
      Attribute.DefaultTo<'other'>;
    user: Attribute.Relation<
      'report-abuse.report-abuse',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
  };
}

export interface PickupPickup extends Schema.Component {
  collectionName: 'components_pickup_pickups';
  info: {
    displayName: 'pickup';
    icon: 'cup';
    description: '';
  };
  attributes: {
    pickup_cost: Attribute.Decimal &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Attribute.DefaultTo<0>;
    pickup_start_time: Attribute.Time & Attribute.DefaultTo<'11:00'>;
    pickup_end_time: Attribute.Time & Attribute.DefaultTo<'22:00'>;
    include_pickup_cost_in_shipping_total_cost: Attribute.Boolean &
      Attribute.Required &
      Attribute.DefaultTo<false>;
  };
}

export interface PhonePhone extends Schema.Component {
  collectionName: 'components_phone_phones';
  info: {
    displayName: 'phone';
    icon: 'phone';
    description: '';
  };
  attributes: {
    phone_number: Attribute.String & Attribute.Required;
  };
}

export interface PackageDimensionsPackageDimensions
  extends Schema.Component {
  collectionName: 'components_package_dimensions_package_dimensions';
  info: {
    displayName: 'package_dimensions';
    icon: 'television';
    description: '';
  };
  attributes: {
    length_in_cm: Attribute.Decimal &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Attribute.DefaultTo<0>;
    width_in_cm: Attribute.Decimal &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Attribute.DefaultTo<0>;
    height_in_cm: Attribute.Decimal &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Attribute.DefaultTo<0>;
  };
}

export interface LinkSectionLinkSection extends Schema.Component {
  collectionName: 'components_link_section_link_sections';
  info: {
    displayName: 'Link Section';
    icon: 'exit';
    description: '';
  };
  attributes: {
    title: Attribute.String & Attribute.Required;
    system: Attribute.String & Attribute.Required;
    applicable_model: Attribute.Text & Attribute.Required;
    file_link: Attribute.Text & Attribute.Required;
  };
}

export interface LinkSectionDatasheetsDownload
  extends Schema.Component {
  collectionName: 'components_link_section_datasheets_downloads';
  info: {
    displayName: 'datasheets_download';
    icon: 'database';
    description: '';
  };
  attributes: {
    title: Attribute.String & Attribute.Required;
    applicable_model: Attribute.Text & Attribute.Required;
    datasheet: Attribute.Media<'files'> & Attribute.Required;
  };
}

export interface LinkSocialLinks extends Schema.Component {
  collectionName: 'components_link_social_links';
  info: {
    displayName: 'social_links';
    icon: 'link';
    description: '';
  };
  attributes: {
    url: Attribute.String & Attribute.Required;
    icon: Attribute.Enumeration<
      ['youtube', 'facebook', 'instagram', 'tiktok']
    > &
      Attribute.Required;
  };
}

export interface LinkLink extends Schema.Component {
  collectionName: 'components_link_links';
  info: {
    displayName: 'Link';
    icon: 'typhoon';
    description: '';
  };
  attributes: {
    name: Attribute.String & Attribute.Required;
    slug: Attribute.String & Attribute.Required;
  };
}

export interface FooterFooter extends Schema.Component {
  collectionName: 'components_footer_footers';
  info: {
    displayName: 'footer';
    icon: 'layout';
    description: '';
  };
  attributes: {
    description: Attribute.Text & Attribute.Required;
    social_links: Attribute.Component<'link.social-links', true>;
    quick_links: Attribute.Component<'link.link', true>;
    contact_us_phone: Attribute.String & Attribute.Required;
    contact_us_email: Attribute.Email & Attribute.Required;
    terms: Attribute.Component<'link.link', true> &
      Attribute.Required;
  };
}

export interface FlyersFlyers extends Schema.Component {
  collectionName: 'components_flyers_flyers';
  info: {
    displayName: 'flyers';
    icon: 'cube';
    description: '';
  };
  attributes: {
    include_flyer_cost_in_total_shipping_cost: Attribute.Boolean &
      Attribute.Required &
      Attribute.DefaultTo<false>;
    total_flyers_free_every_month: Attribute.Decimal &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Attribute.DefaultTo<0>;
    average_cost_per_flyer: Attribute.Decimal &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Attribute.DefaultTo<0>;
  };
}

export interface FeesFees extends Schema.Component {
  collectionName: 'components_fees_fees';
  info: {
    displayName: 'fees';
    icon: 'chartPie';
    description: '';
  };
  attributes: {
    include_the_fee_in_total_shipping_cost: Attribute.Boolean &
      Attribute.Required &
      Attribute.DefaultTo<false>;
    minimum_total_order_price_to_apply_fee: Attribute.Decimal &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Attribute.DefaultTo<0>;
    fixed_fee_amount: Attribute.Decimal &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Attribute.DefaultTo<0>;
    percentage_based_fee: Attribute.Decimal &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Attribute.DefaultTo<0>;
    comment: Attribute.String;
    money_increment_amount: Attribute.Decimal &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Attribute.DefaultTo<0>;
    VAT: Attribute.Decimal &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Attribute.DefaultTo<0>;
    fixed_extra_fee_per_increment: Attribute.Decimal &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Attribute.DefaultTo<0>;
    add_base_fees_to_total_increment_fee: Attribute.Boolean &
      Attribute.Required &
      Attribute.DefaultTo<false>;
    apply_difference_based_fee: Attribute.Boolean &
      Attribute.Required &
      Attribute.DefaultTo<true>;
  };
}

export interface FeaturedProductsFeaturedProducts
  extends Schema.Component {
  collectionName: 'components_featured_products_featured_products';
  info: {
    displayName: 'featured_products';
    icon: 'command';
    description: '';
  };
  attributes: {
    section_name: Attribute.String & Attribute.Required;
    heading_in_black: Attribute.String & Attribute.Required;
    heading_in_red: Attribute.String & Attribute.Required;
    products: Attribute.Relation<
      'featured-products.featured-products',
      'oneToMany',
      'api::product.product'
    >;
  };
}

export interface FeaturedBlogsFeaturedBlogs extends Schema.Component {
  collectionName: 'components_featured_blogs_featured_blogs';
  info: {
    displayName: 'featured-blogs';
    icon: 'pencil';
    description: '';
  };
  attributes: {
    blogs: Attribute.Relation<
      'featured-blogs.featured-blogs',
      'oneToMany',
      'api::blog.blog'
    >;
    slug: Attribute.String & Attribute.Required;
    heading_in_black: Attribute.String & Attribute.Required;
    heading_in_red: Attribute.String & Attribute.Required;
  };
}

export interface FeatureFeatures extends Schema.Component {
  collectionName: 'components_feature_features';
  info: {
    displayName: 'features';
    icon: 'apps';
    description: '';
  };
  attributes: {
    feature: Attribute.Text;
  };
}

export interface ExcelHeadersExcelHeaders extends Schema.Component {
  collectionName: 'components_excel_headers_excel_headers';
  info: {
    displayName: 'EXCEL_Headers';
    icon: 'strikeThrough';
  };
  attributes: {
    header_name: Attribute.String & Attribute.Required;
  };
}

export interface DetailsSpecification extends Schema.Component {
  collectionName: 'components_details_specifications';
  info: {
    displayName: 'specification';
    icon: 'layer';
    description: '';
  };
  attributes: {
    name: Attribute.String & Attribute.Required;
    value: Attribute.Text & Attribute.Required;
  };
}

export interface DeliveryZoneDeliveryZone extends Schema.Component {
  collectionName: 'components_delivery_zone_delivery_zones';
  info: {
    displayName: 'delivery_zone';
    icon: 'train';
    description: '';
  };
  attributes: {
    zone_name_in_arabic: Attribute.String & Attribute.Required;
    delivery_cost: Attribute.Decimal &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Attribute.DefaultTo<0>;
    minimum_delivery_duration_in_days: Attribute.Decimal &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Attribute.DefaultTo<0>;
    maximum_delivery_duration_in_days: Attribute.Decimal &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      > &
      Attribute.DefaultTo<0>;
    VAT: Attribute.Decimal &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Attribute.DefaultTo<0>;
    zone_name_in_english: Attribute.String & Attribute.Required;
    calculated_delivery_cost: Attribute.Decimal &
      Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Attribute.DefaultTo<0>;
  };
}

export interface ContactUsContactUs extends Schema.Component {
  collectionName: 'components_contact_us_contact_uses';
  info: {
    displayName: 'contact-us';
    icon: 'phone';
  };
  attributes: {
    section_name: Attribute.String & Attribute.Required;
    heading: Attribute.Text & Attribute.Required;
    button_text: Attribute.String & Attribute.Required;
    button_url: Attribute.String & Attribute.Required;
  };
}

export interface CategoryCategories extends Schema.Component {
  collectionName: 'components_category_categories';
  info: {
    displayName: 'categories';
    icon: 'chartCircle';
    description: '';
  };
  attributes: {
    title: Attribute.String & Attribute.Required;
    description: Attribute.String & Attribute.Required;
    image: Attribute.Media<'images'> & Attribute.Required;
    slug: Attribute.String & Attribute.Required;
  };
}

export interface CategoriesSectionCategories
  extends Schema.Component {
  collectionName: 'components_categories_section_categories';
  info: {
    displayName: 'categories';
    icon: 'grid';
    description: '';
  };
  attributes: {
    section_name: Attribute.String & Attribute.Required;
    heading_in_black: Attribute.String & Attribute.Required;
    heading_in_red: Attribute.String & Attribute.Required;
    description: Attribute.String & Attribute.Required;
    category: Attribute.Component<'category.categories', true> &
      Attribute.Required;
  };
}

export interface CartProductQuantity extends Schema.Component {
  collectionName: 'components_cart_product_quantities';
  info: {
    displayName: 'product-quantity';
    icon: 'shoppingCart';
    description: '';
  };
  attributes: {
    product: Attribute.Relation<
      'cart.product-quantity',
      'oneToOne',
      'api::product.product'
    >;
    quantity: Attribute.Integer &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      > &
      Attribute.DefaultTo<1>;
    total_cost: Attribute.Decimal &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Attribute.DefaultTo<0>;
    description: Attribute.Text;
  };
}

export interface CarouselHeroSection extends Schema.Component {
  collectionName: 'components_carousel_hero_sections';
  info: {
    displayName: 'Hero Section';
    icon: 'picture';
    description: '';
  };
  attributes: {
    image: Attribute.Media<'images' | 'files' | 'videos' | 'audios'> &
      Attribute.Required;
    headingTop: Attribute.String & Attribute.Required;
    headingBottom: Attribute.String;
    buttonLink: Attribute.Component<'button-link.button-link'> &
      Attribute.Required;
    direction: Attribute.Enumeration<['left', 'right']> &
      Attribute.Required &
      Attribute.DefaultTo<'left'>;
  };
}

export interface ButtonLinkButtonLink extends Schema.Component {
  collectionName: 'components_button_link_button_links';
  info: {
    displayName: 'buttonLink';
    icon: 'link';
    description: '';
  };
  attributes: {
    buttonText: Attribute.String & Attribute.Required;
    button_slug: Attribute.String & Attribute.Required;
  };
}

export interface BrandsBrands extends Schema.Component {
  collectionName: 'components_brands_brands';
  info: {
    displayName: 'brands';
    icon: 'medium';
  };
  attributes: {
    brands: Attribute.Relation<
      'brands.brands',
      'oneToMany',
      'api::brand.brand'
    >;
  };
}

export interface BranchInfoBranch extends Schema.Component {
  collectionName: 'components_branch_info_branches';
  info: {
    displayName: 'branch';
    icon: 'manyToOne';
    description: '';
  };
  attributes: {
    location: Attribute.JSON &
      Attribute.Required &
      Attribute.CustomField<'plugin::google-maps.location-picker'>;
    address: Attribute.Text & Attribute.Required;
    phone: Attribute.Component<'phone.phone', true> &
      Attribute.Required;
    name: Attribute.String & Attribute.Required;
    leaflet_map: Attribute.JSON &
      Attribute.CustomField<'plugin::strapi-leaflet-geoman.geojson'>;
  };
}

export interface AboutUsSectionAboutUs extends Schema.Component {
  collectionName: 'components_about_us_section_about_uses';
  info: {
    displayName: 'about_us';
    icon: 'question';
    description: '';
  };
  attributes: {
    title: Attribute.String & Attribute.Required;
    description: Attribute.Text & Attribute.Required;
    button_text: Attribute.String & Attribute.Required;
    image: Attribute.Media<'images'> & Attribute.Required;
    section_name: Attribute.String & Attribute.Required;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'youtube.video': YoutubeVideo;
      'weight.weight': WeightWeight;
      'social-buttons.social-link': SocialButtonsSocialLink;
      'shipping-delivery-zone.shipping-delivery-zone': ShippingDeliveryZoneShippingDeliveryZone;
      'shared.seo': SharedSeo;
      'shared.meta-social': SharedMetaSocial;
      'report-abuse.report-abuse': ReportAbuseReportAbuse;
      'pickup.pickup': PickupPickup;
      'phone.phone': PhonePhone;
      'package-dimensions.package-dimensions': PackageDimensionsPackageDimensions;
      'link-section.link-section': LinkSectionLinkSection;
      'link-section.datasheets-download': LinkSectionDatasheetsDownload;
      'link.social-links': LinkSocialLinks;
      'link.link': LinkLink;
      'footer.footer': FooterFooter;
      'flyers.flyers': FlyersFlyers;
      'fees.fees': FeesFees;
      'featured-products.featured-products': FeaturedProductsFeaturedProducts;
      'featured-blogs.featured-blogs': FeaturedBlogsFeaturedBlogs;
      'feature.features': FeatureFeatures;
      'excel-headers.excel-headers': ExcelHeadersExcelHeaders;
      'details.specification': DetailsSpecification;
      'delivery-zone.delivery-zone': DeliveryZoneDeliveryZone;
      'contact-us.contact-us': ContactUsContactUs;
      'category.categories': CategoryCategories;
      'categories-section.categories': CategoriesSectionCategories;
      'cart.product-quantity': CartProductQuantity;
      'carousel.hero-section': CarouselHeroSection;
      'button-link.button-link': ButtonLinkButtonLink;
      'brands.brands': BrandsBrands;
      'branch-info.branch': BranchInfoBranch;
      'about-us-section.about-us': AboutUsSectionAboutUs;
    }
  }
}
