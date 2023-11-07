## Prerequisites

Set these environment variables

```
export SUI_NETWORK=devnet

# this will vary
export CRUMB_PACKAGE_ID=0xd7cc53bdedd5912c321bf0328bd38caf523b0a2016133151a7e5ba40e34ca750
export NEXT_PUBLIC_CRUMB_PACKAGE_ID=$CRUMB_PACKAGE_ID
```

## Developing CLI

```
; yarn
; yarn sdk build
; yarn cli run-dev
; yarn cli run-dev get-assets
```

## Developing Frontend

```
; yarn
; yarn sdk build
; yarn frontend dev
```

## Deploying Frontend

```
; yarn
; yarn sdk build
; yarn frontend build
; yarn frontend next export
```
