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

export interface SocialButtonsSocialLink extends Schema.Component {
  collectionName: 'components_social_buttons_social_links';
  info: {
    displayName: 'social-link';
    icon: 'link';
  };
  attributes: {};
}

export interface SharedSeo extends Schema.Component {
  collectionName: 'components_shared_seos';
  info: {
    displayName: 'seo';
    icon: 'search';
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
    metaImage: Attribute.Media<'images' | 'files' | 'videos'>;
    metaSocial: Attribute.Component<'shared.meta-social', true>;
    keywords: Attribute.Text;
    metaRobots: Attribute.String;
    structuredData: Attribute.JSON;
    metaViewport: Attribute.String;
    canonicalURL: Attribute.String;
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

export interface FooterFooter extends Schema.Component {
  collectionName: 'components_footer_footers';
  info: {
    displayName: 'footer';
    icon: 'layout';
  };
  attributes: {
    description: Attribute.Text & Attribute.Required;
    social_links: Attribute.Component<'link.social-links', true>;
    quick_links: Attribute.Component<'link.link', true>;
    contact_us_phone: Attribute.String & Attribute.Required;
    contact_us_email: Attribute.Email & Attribute.Required;
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

export interface FeaturedProductsFeaturedProducts extends Schema.Component {
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
  };
  attributes: {
    blogs: Attribute.Relation<
      'featured-blogs.featured-blogs',
      'oneToMany',
      'api::blog.blog'
    >;
    section_name: Attribute.String & Attribute.Required;
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

export interface DetailsSpecification extends Schema.Component {
  collectionName: 'components_details_specifications';
  info: {
    displayName: 'specification';
    icon: 'layer';
  };
  attributes: {
    name: Attribute.String & Attribute.Required;
    value: Attribute.String & Attribute.Required;
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

export interface CategoriesSectionCategories extends Schema.Component {
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
      'social-buttons.social-link': SocialButtonsSocialLink;
      'shared.seo': SharedSeo;
      'shared.meta-social': SharedMetaSocial;
      'footer.footer': FooterFooter;
      'link.social-links': LinkSocialLinks;
      'link.link': LinkLink;
      'featured-products.featured-products': FeaturedProductsFeaturedProducts;
      'featured-blogs.featured-blogs': FeaturedBlogsFeaturedBlogs;
      'feature.features': FeatureFeatures;
      'details.specification': DetailsSpecification;
      'contact-us.contact-us': ContactUsContactUs;
      'categories-section.categories': CategoriesSectionCategories;
      'category.categories': CategoryCategories;
      'cart.product-quantity': CartProductQuantity;
      'carousel.hero-section': CarouselHeroSection;
      'button-link.button-link': ButtonLinkButtonLink;
      'brands.brands': BrandsBrands;
      'about-us-section.about-us': AboutUsSectionAboutUs;
    }
  }
}
