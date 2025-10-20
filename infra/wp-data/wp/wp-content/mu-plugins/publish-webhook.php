<?php
/**
 * Plugin Name: Publish Webhook Trigger
 */
add_action( 'publish_post', function( $post_id, $post ) {
    if ( 'revision' === $post->post_type ) {
        return;
    }

    $payload = array(
        'post_id' => $post_id,
        'slug'    => $post->post_name,
        'action'  => 'publish',
    );

    $headers = array(
        'Content-Type' => 'application/json',
    );

    $response = wp_remote_post(
        'http://127.0.0.1:8080/internal/webhooks/content-published',
        array(
            'headers' => $headers,
            'body'    => wp_json_encode( $payload ),
            'timeout' => 5,
        )
    );

    if ( is_wp_error( $response ) ) {
        error_log( 'Publish webhook error: ' . $response->get_error_message() );
    }

    $external_headers = $headers;
    $external_headers['x-webhook-secret'] = 'dce8d3a8390cf97311779a8288639936e993bd0f9fe5aa26';

    $external_response = wp_remote_post(
        'http://188.245.150.69/api/webhooks/wp-publish',
        array(
            'headers' => $external_headers,
            'body'    => wp_json_encode( $payload ),
            'timeout' => 10,
        )
    );

    if ( is_wp_error( $external_response ) ) {
        error_log( 'Publish external webhook error: ' . $external_response->get_error_message() );
    }
}, 10, 2 );
