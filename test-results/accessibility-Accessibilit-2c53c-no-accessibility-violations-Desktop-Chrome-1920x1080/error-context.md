# Page snapshot

```yaml
- generic [ref=e3]:
  - link "Skip to booking form" [ref=e4] [cursor=pointer]:
    - /url: "#booking-form"
  - region "Interactive map for selecting pickup and destination" [ref=e5]
  - main [ref=e7]:
    - generic [ref=e8]:
      - generic [ref=e9]:
        - generic [ref=e10]: Book a Ride
        - generic [ref=e11]: Enter your pickup and destination to get started
      - generic [ref=e12]:
        - generic [ref=e13]:
          - generic [ref=e14]: Pickup Location
          - generic [ref=e15]:
            - img [ref=e16]
            - textbox "Pickup location address" [ref=e19]:
              - /placeholder: Enter pickup address
            - generic [ref=e20]: Start typing to search for a pickup location
        - generic [ref=e21]:
          - generic [ref=e22]: Destination
          - generic [ref=e23]:
            - img [ref=e24]
            - textbox "Destination address" [ref=e27]:
              - /placeholder: Enter destination address
            - generic [ref=e28]: Start typing to search for a destination
```