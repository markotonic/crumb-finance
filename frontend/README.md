## Prerequisites

Set these environment variables

```
export SUI_NETWORK=
export CRUMB_PACKAGE_ID=
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

## Running Oracle

The oracle script loads keys from the filesystem keystore at
`~/.sui/sui_config/sui.keystore`. You can list available signer addresses with
`sui client addresses`. You must use an address that owns a Crumb Oracle Cap object.

```
export SUI_NETWORK=devnet
export CRUMB_PACKAGE_ID=<crumb package id here>
export SIGNER_ID=<signer id here>

yarn cli run-dev run-price-oracle
```

## Running Keeper/Executor

The keeper script loads keys from the filesystem keystore at
`~/.sui/sui_config/sui.keystore`. You can list available signer addresses with
`sui client addresses`.

```
export SUI_NETWORK=devnet
export CRUMB_PACKAGE_ID=<crumb package id here>
export SIGNER_ID=<signer id here>

yarn cli run-dev run-executor
```

## Adding Asset

```
export SUI_NETWORK=devnet
export SIGNER_ID=<signer id here>
export CRUMB_PACKAGE_ID=<crumb package id here>
export CRUMB_GLOBAL_TABLE_ID=<global table id here>

yarn cli run-dev run-executor
```
