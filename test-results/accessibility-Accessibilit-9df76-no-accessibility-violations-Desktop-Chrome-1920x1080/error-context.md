# Page snapshot

```yaml
- generic [ref=e2]:
  - link "Skip to main content" [ref=e3] [cursor=pointer]:
    - /url: "#main-content"
  - generic [ref=e5]:
    - banner [ref=e6]:
      - heading "Rider Dashboard" [level=1] [ref=e7]
    - main [ref=e8]:
      - region "Rider Statistics" [ref=e9]:
        - heading "Rider Statistics" [level=2] [ref=e10]
        - generic [ref=e11]:
          - generic [ref=e12]:
            - generic [ref=e14]: Total Rides
            - generic [ref=e16]:
              - img [ref=e17]
              - generic "0 total rides completed" [ref=e20]: "0"
          - generic [ref=e21]:
            - generic [ref=e23]: RIDE Tokens
            - generic [ref=e25]:
              - img [ref=e26]
              - generic "0 RIDE tokens" [ref=e28]: "0"
          - generic [ref=e29]:
            - generic [ref=e31]: Total Spent
            - generic [ref=e33]:
              - img [ref=e34]
              - generic "$0.00 total spent" [ref=e36]: $0.00
      - region "Request a Ride" [ref=e37]:
        - generic [ref=e38]:
          - generic [ref=e39]:
            - generic [ref=e40]: Request a Ride
            - generic [ref=e41]: Enter your pickup and destination to get started
          - button "Book a new ride" [ref=e43] [cursor=pointer]: Book a Ride
      - region "Recent Rides" [ref=e44]:
        - generic [ref=e45]:
          - generic [ref=e47]: Recent Rides
          - status [ref=e49]: No rides yet. Book your first ride to get started!
```