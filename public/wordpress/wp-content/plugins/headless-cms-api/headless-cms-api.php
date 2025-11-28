<?php
/**
 * Plugin Name: Headless CMS API
 * Description: Custom REST API endpoints for headless CMS functionality. Provides unified endpoints for content delivery.
 * Version: 1.0.0
 * Author: Kenfinly Team
 * Text Domain: headless-cms-api
 */

if (!defined('ABSPATH')) {
    exit;
}

class Headless_CMS_API {

    private static $instance = null;

    public static function get_instance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        add_action('rest_api_init', array($this, 'register_endpoints'));
        add_action('init', array($this, 'register_custom_post_types'));
        add_action('init', array($this, 'add_cors_headers'));
        add_filter('rest_pre_serve_request', array($this, 'rest_cors_headers'), 10, 4);
        add_action('plugins_loaded', array($this, 'activate_required_plugins'));
    }

    public function add_cors_headers() {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Authorization, Content-Type, X-WP-Nonce');
    }

    public function rest_cors_headers($served, $result, $request, $server) {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Authorization, Content-Type, X-WP-Nonce');
        header('Access-Control-Allow-Credentials: true');
        return $served;
    }

    public function activate_required_plugins() {
        if (!function_exists('activate_plugin')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }
        $plugins_to_activate = array(
            'jwt-authentication-for-wp-rest-api/jwt-auth.php',
            'sqlite-database-integration/load.php'
        );
        foreach ($plugins_to_activate as $plugin) {
            if (!is_plugin_active($plugin) && file_exists(WP_PLUGIN_DIR . '/' . $plugin)) {
                activate_plugin($plugin);
            }
        }
    }

    public function register_custom_post_types() {
        register_post_type('financial_tip', array(
            'labels' => array(
                'name' => 'Financial Tips',
                'singular_name' => 'Financial Tip',
                'add_new' => 'Add New Tip',
                'add_new_item' => 'Add New Financial Tip',
                'edit_item' => 'Edit Financial Tip',
                'view_item' => 'View Financial Tip'
            ),
            'public' => true,
            'show_in_rest' => true,
            'rest_base' => 'financial-tips',
            'supports' => array('title', 'editor', 'excerpt', 'thumbnail', 'custom-fields'),
            'has_archive' => true,
            'menu_icon' => 'dashicons-chart-line'
        ));

        register_post_type('news', array(
            'labels' => array(
                'name' => 'News Articles',
                'singular_name' => 'News Article',
                'add_new' => 'Add News',
                'add_new_item' => 'Add New Article',
                'edit_item' => 'Edit Article',
                'view_item' => 'View Article'
            ),
            'public' => true,
            'show_in_rest' => true,
            'rest_base' => 'news',
            'supports' => array('title', 'editor', 'excerpt', 'thumbnail', 'custom-fields'),
            'has_archive' => true,
            'menu_icon' => 'dashicons-megaphone'
        ));

        register_post_type('faq', array(
            'labels' => array(
                'name' => 'FAQs',
                'singular_name' => 'FAQ',
                'add_new' => 'Add FAQ',
                'add_new_item' => 'Add New FAQ',
                'edit_item' => 'Edit FAQ',
                'view_item' => 'View FAQ'
            ),
            'public' => true,
            'show_in_rest' => true,
            'rest_base' => 'faqs',
            'supports' => array('title', 'editor', 'custom-fields'),
            'has_archive' => true,
            'menu_icon' => 'dashicons-editor-help'
        ));

        register_taxonomy('tip_category', 'financial_tip', array(
            'labels' => array(
                'name' => 'Tip Categories',
                'singular_name' => 'Tip Category'
            ),
            'public' => true,
            'show_in_rest' => true,
            'rest_base' => 'tip-categories',
            'hierarchical' => true
        ));
    }

    public function register_endpoints() {
        register_rest_route('headless/v1', '/all-content', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_all_content'),
            'permission_callback' => '__return_true'
        ));

        register_rest_route('headless/v1', '/content/(?P<type>[a-zA-Z0-9_-]+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_content_by_type'),
            'permission_callback' => '__return_true',
            'args' => array(
                'type' => array(
                    'required' => true,
                    'type' => 'string'
                ),
                'per_page' => array(
                    'default' => 10,
                    'type' => 'integer'
                ),
                'page' => array(
                    'default' => 1,
                    'type' => 'integer'
                )
            )
        ));

        register_rest_route('headless/v1', '/content/(?P<type>[a-zA-Z0-9_-]+)/(?P<id>\d+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_single_content'),
            'permission_callback' => '__return_true'
        ));

        register_rest_route('headless/v1', '/menus', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_menus'),
            'permission_callback' => '__return_true'
        ));

        register_rest_route('headless/v1', '/site-info', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_site_info'),
            'permission_callback' => '__return_true'
        ));

        register_rest_route('headless/v1', '/search', array(
            'methods' => 'GET',
            'callback' => array($this, 'search_content'),
            'permission_callback' => '__return_true',
            'args' => array(
                'query' => array(
                    'required' => true,
                    'type' => 'string'
                )
            )
        ));
    }

    public function get_all_content($request) {
        $content_types = array('post', 'page', 'financial_tip', 'news', 'faq');
        $result = array(
            'site_info' => $this->get_site_info_data(),
            'content' => array()
        );

        foreach ($content_types as $type) {
            $posts = get_posts(array(
                'post_type' => $type,
                'numberposts' => 5,
                'post_status' => 'publish'
            ));

            $result['content'][$type] = array_map(function($post) {
                return $this->format_post($post);
            }, $posts);
        }

        return new WP_REST_Response($result, 200);
    }

    public function get_content_by_type($request) {
        $type = sanitize_text_field($request['type']);
        $per_page = intval($request['per_page']);
        $page = intval($request['page']);

        $args = array(
            'post_type' => $type,
            'posts_per_page' => $per_page,
            'paged' => $page,
            'post_status' => 'publish'
        );

        $query = new WP_Query($args);
        $posts = array_map(function($post) {
            return $this->format_post($post);
        }, $query->posts);

        return new WP_REST_Response(array(
            'posts' => $posts,
            'total' => $query->found_posts,
            'total_pages' => $query->max_num_pages,
            'current_page' => $page
        ), 200);
    }

    public function get_single_content($request) {
        $type = sanitize_text_field($request['type']);
        $id = intval($request['id']);

        $post = get_post($id);

        if (!$post || $post->post_type !== $type) {
            return new WP_Error('not_found', 'Content not found', array('status' => 404));
        }

        return new WP_REST_Response($this->format_post($post, true), 200);
    }

    public function get_menus($request) {
        $menus = wp_get_nav_menus();
        $result = array();

        foreach ($menus as $menu) {
            $items = wp_get_nav_menu_items($menu->term_id);
            $result[$menu->slug] = array(
                'name' => $menu->name,
                'items' => array_map(function($item) {
                    return array(
                        'id' => $item->ID,
                        'title' => $item->title,
                        'url' => $item->url,
                        'parent' => $item->menu_item_parent
                    );
                }, $items ?: array())
            );
        }

        return new WP_REST_Response($result, 200);
    }

    public function get_site_info($request) {
        return new WP_REST_Response($this->get_site_info_data(), 200);
    }

    private function get_site_info_data() {
        return array(
            'name' => get_bloginfo('name'),
            'description' => get_bloginfo('description'),
            'url' => get_bloginfo('url'),
            'admin_email' => get_bloginfo('admin_email'),
            'language' => get_bloginfo('language'),
            'charset' => get_bloginfo('charset'),
            'version' => get_bloginfo('version')
        );
    }

    public function search_content($request) {
        $query = sanitize_text_field($request['query']);

        $args = array(
            'post_type' => array('post', 'page', 'financial_tip', 'news', 'faq'),
            's' => $query,
            'posts_per_page' => 20,
            'post_status' => 'publish'
        );

        $wp_query = new WP_Query($args);
        $posts = array_map(function($post) {
            return $this->format_post($post);
        }, $wp_query->posts);

        return new WP_REST_Response(array(
            'query' => $query,
            'results' => $posts,
            'total' => $wp_query->found_posts
        ), 200);
    }

    private function format_post($post, $full = false) {
        $data = array(
            'id' => $post->ID,
            'title' => $post->post_title,
            'slug' => $post->post_name,
            'excerpt' => get_the_excerpt($post),
            'date' => $post->post_date,
            'modified' => $post->post_modified,
            'type' => $post->post_type,
            'featured_image' => get_the_post_thumbnail_url($post->ID, 'full'),
            'author' => array(
                'id' => $post->post_author,
                'name' => get_the_author_meta('display_name', $post->post_author)
            )
        );

        if ($full) {
            $data['content'] = apply_filters('the_content', $post->post_content);
            $data['meta'] = get_post_meta($post->ID);
            $data['categories'] = wp_get_post_categories($post->ID, array('fields' => 'all'));
            $data['tags'] = wp_get_post_tags($post->ID, array('fields' => 'all'));
        }

        return $data;
    }
}

Headless_CMS_API::get_instance();

add_action('after_setup_theme', function() {
    add_theme_support('post-thumbnails');
    add_theme_support('title-tag');
    add_theme_support('custom-logo');
});
