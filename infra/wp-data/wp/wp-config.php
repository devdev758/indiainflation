<?php
// --- allow application passwords even on HTTP ---
if ( function_exists( 'add_filter' ) ) {
    add_filter( 'wp_is_application_passwords_available', '__return_true' );
    add_filter( 'wp_is_https_supported', '__return_true' );
    add_filter( 'wp_application_password_is_api_request', '__return_true' );
}

/**
 * The base configuration for WordPress
 */

// helper: look up env vars in Docker style
if ( ! function_exists( 'getenv_docker' ) ) {
	function getenv_docker( $env, $default ) {
		if ( $fileEnv = getenv( $env . '_FILE' ) ) {
			return rtrim( file_get_contents( $fileEnv ), "\r\n" );
		} elseif ( ( $val = getenv( $env ) ) !== false ) {
			return $val;
		} else {
			return $default;
		}
	}
}

// ** Database settings ** //
define( 'DB_NAME', 'wordpress' );
define( 'DB_USER', 'wordpress' );
define( 'DB_PASSWORD', '32f07324faa589668362efe60d1135a5' );
define( 'DB_HOST', 'mariadb' );
define( 'DB_CHARSET',  'utf8' );
define( 'DB_COLLATE',  '' );



/** Database charset to use in creating database tables. */

/** The database collate type. Don't change this if in doubt. */

/**#@+
 * Authentication unique keys and salts.
 *
 * Change these to different unique phrases! You can generate these using
 *
 * You can change these at any point in time to invalidate all existing cookies.
 * This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define( 'AUTH_KEY',         getenv_docker('WORDPRESS_AUTH_KEY',         '9e912ae3921ab5fc62cd8c9a960d92db295f7694') );
define( 'SECURE_AUTH_KEY',  getenv_docker('WORDPRESS_SECURE_AUTH_KEY',  '908341f541b1f1d2b8ae7a0c3a3a070158dc4fd6') );
define( 'LOGGED_IN_KEY',    getenv_docker('WORDPRESS_LOGGED_IN_KEY',    '4fb0651f801bad86e7f03265dffb757e677bd52f') );
define( 'NONCE_KEY',        getenv_docker('WORDPRESS_NONCE_KEY',        'c55bb7a2758008681290557269abcd578da106bf') );
define( 'AUTH_SALT',        getenv_docker('WORDPRESS_AUTH_SALT',        'a93959ed34c11516f1b1a5985120f87b4f322196') );
define( 'SECURE_AUTH_SALT', getenv_docker('WORDPRESS_SECURE_AUTH_SALT', '0e3fff9438de8965946d5070a07d54b603f2f45b') );
define( 'LOGGED_IN_SALT',   getenv_docker('WORDPRESS_LOGGED_IN_SALT',   '13da502407bc33de707ae6e906c3bf11daebb126') );
define( 'NONCE_SALT',       getenv_docker('WORDPRESS_NONCE_SALT',       '9974978ec096c5a596a543626512641f11ec24af') );
// (See also https://wordpress.stackexchange.com/a/152905/199287)

/**#@-*/

/**
 * WordPress database table prefix.
 *
 * You can have multiple installations in one database if you give each
 * a unique prefix. Only numbers, letters, and underscores please!
 */
$table_prefix = getenv_docker('WORDPRESS_TABLE_PREFIX', 'wp_');

/**
 * For developers: WordPress debugging mode.
 *
 * Change this to true to enable the display of notices during development.
 * It is strongly recommended that plugin and theme developers use WP_DEBUG
 * in their development environments.
 *
 * For information on other constants that can be used for debugging,
 * visit the documentation.
 *
 * @link https://developer.wordpress.org/advanced-administration/debug/debug-wordpress/
 */
define( 'WP_DEBUG', !!getenv_docker('WORDPRESS_DEBUG', '') );

/* Add any custom values between this line and the "stop editing" line. */

// If we're behind a proxy server and using HTTPS, we need to alert WordPress of that fact
// see also https://wordpress.org/support/article/administration-over-ssl/#using-a-reverse-proxy
if (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && strpos($_SERVER['HTTP_X_FORWARDED_PROTO'], 'https') !== false) {
	$_SERVER['HTTPS'] = 'on';
}
// (we include this by default because reverse proxying is extremely common in container environments)

if ($configExtra = getenv_docker('WORDPRESS_CONFIG_EXTRA', '')) {
	eval($configExtra);
}

/* That's all, stop editing! Happy publishing. */

/** Absolute path to the WordPress directory. */
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

/** Sets up WordPress vars and included files. */
require_once ABSPATH . 'wp-settings.php';


if ( function_exists( 'add_filter' ) ) {
    add_filter( 'wp_is_application_passwords_available', '__return_true' );
    add_filter( 'wp_is_https_supported', '__return_true' );
    add_filter( 'wp_application_password_is_api_request', '__return_true' );
}

