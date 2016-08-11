<?php

/** Enable W3 Total Cache */

define('WP_CACHE', true); // Added by W3 Total Cache



/**

 * The base configuration for WordPress

 *

 * The wp-config.php creation script uses this file during the

 * installation. You don't have to use the web site, you can

 * copy this file to "wp-config.php" and fill in the values.

 *

 * This file contains the following configurations:

 *

 * * MySQL settings

 * * Secret keys

 * * Database table prefix

 * * ABSPATH

 *

 * @link https://codex.wordpress.org/Editing_wp-config.php

 *

 * @package WordPress

 */



// ** MySQL settings - You can get this info from your web host ** //

/** The name of the database for WordPress */

define('DB_NAME', 'playlabo_wordpress96f');


/** MySQL database username */

define('DB_USER', 'playlabo_word96f');


/** MySQL database password */

define('DB_PASSWORD', 'frY3m01Z4EZu');


/** MySQL hostname */

define('DB_HOST', 'localhost');


/** Database Charset to use in creating database tables. */

define('DB_CHARSET', 'utf8');



/** The Database Collate type. Don't change this if in doubt. */

define('DB_COLLATE', '');



/**#@+

 * Authentication Unique Keys and Salts.

 *

 * Change these to different unique phrases!

 * You can generate these using the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}

 * You can change these at any point in time to invalidate all existing cookies. This will force all users to have to log in again.

 *

 * @since 2.6.0

 */

define('AUTH_KEY', 'ZPG%nk}A@E(aeTxJH$*w|o^AnZCk%JN%Cvs]<N|qMpX_A_C$cPjO_L=cN-t^;IO}=KUN>iqv@lKMDSi@l?Yfx@IbNQnc{Pjo-KFWs@?[-g>O*cS]ila;Bl_-tz}zdB)_');
define('SECURE_AUTH_KEY', 'nH&nTb?<xv&BL&%P=$qCa(<W;W*Vrdm=|+Msl]}cab?TtuW$mc@ih=vnZ=O+=s@gMd]teDqA][lbJPc[!+-tU*ZdeCgYLqUOq&x{UsDGjBVIlkZxRxDGRxHKL^$nvmow');
define('LOGGED_IN_KEY', 'f(JjYbTd&-RwtR%$-v/$MkcDM}&-iA)a^pi?zt;+K%a$GHC@KBMwmATjn[BHa&xcNtItwYG/eT**o-Ib/ze+=AHXLUCVQ}^dDEKRWHY-UX}AA_><gmq{!s=pEqdc@S}U');
define('NONCE_KEY', 'SppuyBGnt-q|x=UABDNLAf;(Zb[JN[pxeY+C)F;/({d_OuSZ;T|cKbEA(GG(yFo?mY!!?sEru=vCUmokS^+GVjCjkGFa&lIMANKiqbv{lDe<wRu^se(D%glavgA_x{KW');
define('AUTH_SALT', '$WGxaA_@K;Yrd&W}!xzrX;R*;D>RvkuG;{|btlJ-n}VW;p-&CIFz/_>}tA(bx&njR>_t_rZslh/MemXNsSGw)+x{+JXv(a%*;(ad+uVEqbutqEjt>idSOdh{vtc_KND}');
define('SECURE_AUTH_SALT', 'YW&Lva}D&$uxRp]fDN)humtZwJMzFEYLq!G!iR%q(CYJ{&ty!BZKrosNBWz$+&CSI(_w*[>n_rkY&H_Tga_+)yABqa]G+-j^(D/]nr$;d]<Y[rv}xTPy]&I/;juPkMnA');
define('LOGGED_IN_SALT', 'z}HcOB>Gh?vQ|&|RxErlkY![P![bV[<bpuflPCJLrtDgk]aF(zfpa}|MjEwEXoetG<YXXo-?]{*qv%JkV_}}i+=}YZDEXv>H&Zs[*fxqhWiZo+[r(yH{?+jf(c*m%Yy)');
define('NONCE_SALT', '^+FyAs-%e=j-}chtfQ^W-lbAkPVEe$lB?EY>QWb/*WMiel*-DAFy;O]]%s]os=-gbVNJSl{($HJ<@%(VbT!wfCT+cj=vl;N*LF@MO&uzhp*(cii<JJ!A?bq[lx;@R=?V');


/**#@-*/



/**

 * WordPress Database Table prefix.

 *

 * You can have multiple installations in one database if you give each

 * a unique prefix. Only numbers, letters, and underscores please!

 */

$table_prefix = 'wp_efax_';


/**

 * For developers: WordPress debugging mode.

 *

 * Change this to true to enable the display of notices during development.

 * It is strongly recommended that plugin and theme developers use WP_DEBUG

 * in their development environments.

 *

 * For information on other constants that can be used for debugging,

 * visit the Codex.

 *

 * @link https://codex.wordpress.org/Debugging_in_WordPress

 */

define('WP_DEBUG', false);



/* That's all, stop editing! Happy blogging. */



/** Absolute path to the WordPress directory. */

if ( !defined('ABSPATH') )

	define('ABSPATH', dirname(__FILE__) . '/');



/** Sets up WordPress vars and included files. */

require_once(ABSPATH . 'wp-settings.php');




