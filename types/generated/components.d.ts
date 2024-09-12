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

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'youtube.video': YoutubeVideo;
      'details.specification': DetailsSpecification;
      'feature.features': FeatureFeatures;
    }
  }
}
