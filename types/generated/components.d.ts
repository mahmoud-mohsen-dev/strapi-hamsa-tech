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
  };
  attributes: {
    section_name: Attribute.String & Attribute.Required;
    heading_in_black: Attribute.String & Attribute.Required;
    heading_in_red: Attribute.String;
    products: Attribute.Relation<
      'featured-products.featured-products',
      'oneToMany',
      'api::product.product'
    >;
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

export interface CategoryCategories extends Schema.Component {
  collectionName: 'components_category_categories';
  info: {
    displayName: 'categories';
    icon: 'chartCircle';
  };
  attributes: {
    title: Attribute.String & Attribute.Required;
    desctiption: Attribute.String & Attribute.Required;
    image: Attribute.Media<'images'> & Attribute.Required;
  };
}

export interface CategoriesSectionCategories extends Schema.Component {
  collectionName: 'components_categories_section_categories';
  info: {
    displayName: 'categories';
    icon: 'grid';
  };
  attributes: {
    section_name: Attribute.String & Attribute.Required;
    heading_in_black: Attribute.String & Attribute.Required;
    heading_in_red: Attribute.String & Attribute.Required;
    desctiption: Attribute.String & Attribute.Required;
    category: Attribute.Component<'category.categories', true> &
      Attribute.Required;
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

export interface AboutUsSectionAboutUs extends Schema.Component {
  collectionName: 'components_about_us_section_about_uses';
  info: {
    displayName: 'about_us';
    icon: 'question';
  };
  attributes: {
    title: Attribute.String & Attribute.Required;
    desctiption: Attribute.Text & Attribute.Required;
    button_text: Attribute.String & Attribute.Required;
    image: Attribute.Media<'images'> & Attribute.Required;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'youtube.video': YoutubeVideo;
      'shared.seo': SharedSeo;
      'shared.meta-social': SharedMetaSocial;
      'link.link': LinkLink;
      'featured-products.featured-products': FeaturedProductsFeaturedProducts;
      'feature.features': FeatureFeatures;
      'details.specification': DetailsSpecification;
      'category.categories': CategoryCategories;
      'categories-section.categories': CategoriesSectionCategories;
      'carousel.hero-section': CarouselHeroSection;
      'button-link.button-link': ButtonLinkButtonLink;
      'about-us-section.about-us': AboutUsSectionAboutUs;
    }
  }
}
