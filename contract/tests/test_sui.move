// The reason this file exists is that there is no Metadata for the native SUI token
// in the test environment at the time of writing
#[test_only]
module crumb::test_sui {
    use std::option;
    use sui::coin;
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::url;

    struct TEST_SUI has drop {}

    fun init(otw: TEST_SUI, ctx: &mut TxContext) {
        let (treasury, metadata) = coin::create_currency(
            otw,
            9,
            b"tSUI",
            b"Test SUI",
            b"",
            option::none(),
            ctx,
        );
        transfer::public_share_object(treasury);
        transfer::public_share_object(metadata);
    }

    #[test_only]
    public fun init_test_sui(ctx: &mut TxContext) {
        init(TEST_SUI {}, ctx)
    }
}