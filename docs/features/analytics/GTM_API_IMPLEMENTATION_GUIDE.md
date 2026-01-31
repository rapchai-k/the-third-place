# GTM API Implementation Guide

This guide describes how to implement the analytics events in Google Tag Manager using the provided [gtm_events_schema.json](file:///Users/karan/Desktop/the-third-place/docs/gtm_events_schema.json).

## Core Concepts

### 1. Data Layer Variables
For every parameter listed in the schema, you must create a **Data Layer Variable** in GTM.
- **Variable Type**: Data Layer Variable
- **Data Layer Variable Name**: Use the parameter name (e.g., `page_path`)
- **Name in GTM**: We recommend a prefix for clarity, e.g., `dlv - page_path`

### 2. Custom Event Triggers
For every event in the schema, you must create a **Custom Event Trigger**.
- **Trigger Type**: Custom Event
- **Event Name**: Use the `eventName` from the schema (e.g., `tp_page_view`)
- **Trigger Name**: We recommend a prefix, e.g., `CE - tp_page_view`

### 3. GA4 Event Tags
Finally, create a **GA4 Event Tag** for each event.
- **Tag Type**: GA4 Event
- **Configuration Tag**: Your GA4 configuration tag
- **Event Name**: 
    - For `tp_page_view`, use `page_view` (GA4 predefined name)
    - For others, use the `eventName` or a matching GA4 predefined name (e.g., `login`, `purchase`)
- **Event Parameters**: Add the corresponding Data Layer Variables as parameters.

## Special Instruction: tp_page_view
In our implementation, we use `tp_page_view` to prevent double-counting when GA4's default "Enhanced Measurement" is also on. 
1. In your GA4 Configuration tag, set **Send a page view event when this configuration loads** to `false`.
2. Create the `tp_page_view` tag as described above to act as the primary page view tracker.

## E-commerce Mapping
Our e-commerce events (`view_item`, `begin_checkout`, `purchase`, `refund`) follow the standard GA4 schema. GTM can often automatically read these if you check the **Send E-commerce data** box and set the **Data Source** to `Data Layer`.
