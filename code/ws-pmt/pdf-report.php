<?php
/*
Plugin Name: <redacted>
Version: 1.0
Description: Provides export to PDF functionality
Author: Thorongil
Author URI: http://www.thorongil.com
Plugin URI: <redacted>
Developers: Erik Beijerman
License: MIT
*/

/**
 * Generate a PDF based on a set of page IDs
 *
 * @param  array $pageIDs
 */
function pmtGetPdf($pageIDs = [])
{
    $filename = '/pdf/' . md5(implode('-', $pageIDs)) . '.pdf';
    $pdf      = new FPDI();

    $pdf->SetTitle('Mijn verslag');
    $pdf->SetAutoPageBreak(TRUE, PDF_MARGIN_BOTTOM);
    $pdf->setFontSubsetting(true);
    $pdf->SetPrintHeader(false);
    $pdf->SetPrintFooter(false);

    // Loop through the pages
    foreach ($pageIDs as $pageID) {
        $pagePDF = WP_CONTENT_DIR . '/pdf/' . $pageID . '.pdf';

        // Create the page's PDF
        if (!file_exists($pagePDF)) {
            pmtCreatePagePdf($pageID);
        }

        // Add all PDF pages to main PDF
        $pageCount = $pdf->setSourceFile($pagePDF);
        for ($pageNo = 1; $pageNo <= $pageCount; $pageNo++) {
            $tplIdx = $pdf->ImportPage($pageNo);
            $s      = $pdf->getTemplatesize($tplIdx);
            $pdf->AddPage($s['w'] > $s['h'] ? 'L' : 'P', [$s['w'], $s['h']]);
            $pdf->useTemplate($tplIdx);
        }
    }

    // Output the merged PDF
    $pdf->Output(WP_CONTENT_DIR . $filename, 'F');

    echo json_encode([
        "url" => WP_CONTENT_URL . $filename
    ]);
    wp_die();
}

/**
 * Display admin notification
 *
 * @param string $message
 */
function pmtAdminNotice($message = null)
{
    echo "<div class='error'><p><strong>PMT - PDF Export</strong>: $message</p></div>";
}

/**
 * Output shortcode result
 */
function pmtShowAddbutton()
{
    global $post, $_SESSION;
    $rootPage = get_page_by_title('<redacted>');

    if (
        isset($_SESSION['pmt'][$post->ID]) ||
        !in_array($rootPage->ID, $post->ancestors)
    ) {
        return;
    }

    echo '<a class="add-to" href="#" data-id="' . $post->ID . '">Voeg toe aan mijn verslag</a>';
}

add_shortcode('pmt_addbutton', 'pmtShowAddbutton');

// Enqueue your scripts
function pmtLoadScripts()
{
    wp_enqueue_script('pmt-ajax', plugin_dir_url(__FILE__) . 'functions.js', ['jquery'], '1.0', true);
    wp_localize_script('pmt-ajax', 'pmt', ['ajaxurl' => admin_url('admin-ajax.php')]);
}

add_action('wp_enqueue_scripts', 'pmtLoadScripts');

/**
 * Handle ajax call
 */
function pmtOnAddPage()
{
    global $_SESSION, $_REQUEST;
    if (isset($_REQUEST['post_id'])) {
        $_SESSION['pmt'][$_REQUEST['post_id']] = [];
    }
    wp_die();
}

add_action('wp_ajax_nopriv_pmt_add_page', 'pmtOnAddPage');
add_action('wp_ajax_pmt_add_page', 'pmtOnAddPage');

/**
 * Handle ajax call
 */
function pmtOnDelPage()
{
    global $_SESSION;
    if (isset($_REQUEST['post_id'])) {
        unset($_SESSION['pmt'][$_REQUEST['post_id']]);
        session_write_close();
    }
    wp_die();
}

add_action('wp_ajax_nopriv_pmt_del_page', 'pmtOnDelPage');
add_action('wp_ajax_pmt_del_page', 'pmtOnDelPage');

/**
 * Handle ajax call
 */
function pmtGetBundle()
{
    global $_SESSION;
    if (isset($_REQUEST['pages'])) {
        pmtGetPdf($_REQUEST['pages']);
    }
    wp_die();
}

add_action('wp_ajax_nopriv_pmt_get_bundle', 'pmtGetBundle');
add_action('wp_ajax_pmt_get_bundle', 'pmtGetBundle');

/**
 * Create PDF
 */
function pmtCreatePagePdf($pageID)
{
    /* Prepare the exec() parameters */
    $exec_params = [
        $_ENV['PHANTOMJS_BIN'],
        dirname(WP_CONTENT_DIR) . '/html2pdf.js',
        '"' . get_permalink($pageID) . '"',
        WP_CONTENT_DIR . '/pdf/' . $pageID . '.pdf'
    ];

    /* This is a hack for docker */
    if (stristr($exec_params[2], 'localhost:8000')) {
        $exec_params[2] = '"http://172.18.0.1:8000"' . wp_make_link_relative(get_permalink($pageID));
    }

    /* Call phantomjs (doesnt work in docker unfortunately) */
    exec(implode(' ', $exec_params));

    return true;
}

/**
 * Clear post PDF on save
 */
function pmtClearPagePdf($pageID = null)
{
    $pageID  = !empty($pageID) ? $pageID : $_POST['post_ID'];
    $pagePDF = WP_CONTENT_DIR . '/pdf/' . $pageID . '.pdf';
    if (file_exists($pagePDF)) {
        unlink($pagePDF);
    }
    pmtCreatePagePdf($pageID);
}

add_action('save_post', 'pmtClearPagePdf');

/**
 * Make sure we start with a usable session
 */
function pmtInitSession()
{
    global $_SESSION;
    if (!session_id()) {
        session_start();
    }
    if (!isset($_SESSION['pmt'])) {
        $_SESSION['pmt'] = [];
    }
}

add_action('init', 'pmtInitSession');

/**
 * Admin iitialization method
 */
function pmtAdminInit()
{
    if (!class_exists('TCPDF')) {
        pmtAdminNotice('TCPDF not found, please run `composer install`');

        return false;
    }
}

add_action('admin_init', 'pmtAdminInit');

/**
 * Add specific menu location attributes
 */
function add_specific_menu_location_atts($atts, $item, $args)
{
    if ($item->title === 'Mijn verslag') {
        $num = (int)count($_SESSION['pmt']);
        $item->title .= ' (<span class="pmt-bundle-num">' . $num . '</span>)';
    }

    return $atts;
}

add_filter('nav_menu_link_attributes', 'add_specific_menu_location_atts', 10, 3);


/**
 * Clear PDF cache on snippet update
 */
function pmtUpdatedOption($option)
{
    preg_match('/rhs\_snippet\-(.*)/is', $option, $matches);
    if (empty($matches)) {
        return true;
    }

    $snippetId = array_pop($matches);
    $shortcode = 'raw_html_snippet';

    $pages = get_pages($args);
    $list  = [];
    foreach ($pages as $page) {
        if (
            has_shortcode($page->post_content, $shortcode) &&
            preg_match('/\[raw\_html\_snippet id\=\"' . $snippetId . '\"\]/is', $page->post_content) > 0
        ) {
            pmtClearPagePdf($page->ID);
        }
    }

    return true;
}

add_action('update_option', 'pmtUpdatedOption');

/**
 * Full site PDF generator
 */
function my_custom_url_handler()
{
    if ($_SERVER["REQUEST_URI"] !== '/pmt-pdf-generate-all') {
        return true;
    }

    $pages = get_pages();
    foreach ($pages as $page) {
        $pagePDF = WP_CONTENT_DIR . '/pdf/' . $page->ID . '.pdf';
        // Create the page's PDF
        if (!file_exists($pagePDF)) {
            pmtCreatePagePdf($page->ID);
        }
    }
}

add_action('parse_request', 'my_custom_url_handler');
