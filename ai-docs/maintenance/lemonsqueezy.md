# Lemonsqueezy

## Find out LEMONSQUEEZY_STORE_ID

```
export LEMONSQUEEZY_API_KEY=$(grep LEMONSQUEEZY_API_KEY .env | cut -d '=' -f2) && \
curl -X GET "https://api.lemonsqueezy.com/v1/stores" \
  -H "Authorization: Bearer $LEMONSQUEEZY_API_KEY"
```

## Find out LEMONSQUEEZY_VARIANT_ID

```
curl -X GET "https://api.lemonsqueezy.com/v1/variants?filter%5Bproduct_id%5D=1072701" \
  -H "Authorization: Bearer $LEMONSQUEEZY_API_KEY"
```
