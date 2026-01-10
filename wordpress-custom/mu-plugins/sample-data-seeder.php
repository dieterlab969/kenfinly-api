<?php
/**
 * Plugin Name: Sample Data Seeder
 * Description: Seeds sample content for headless CMS testing
 */

add_action('init', function() {
    if (get_option('headless_sample_data_seeded')) {
        return;
    }
    
    if (!current_user_can('manage_options') && !defined('WP_CLI')) {
        return;
    }
});

function headless_seed_sample_data() {
    if (get_option('headless_sample_data_seeded')) {
        return false;
    }

    $financial_tips = array(
        array(
            'title' => 'Start with an Emergency Fund',
            'content' => '<p>Financial experts recommend having 3-6 months of expenses saved in an easily accessible emergency fund. This provides a safety net for unexpected expenses like medical bills, car repairs, or job loss.</p><p>Start small by setting aside $500-$1000, then gradually build up to your full emergency fund goal.</p>',
            'excerpt' => 'Learn why an emergency fund should be your first financial priority.'
        ),
        array(
            'title' => 'Track Your Spending',
            'content' => '<p>Understanding where your money goes is the foundation of good financial health. Use apps like Kenfinly to categorize and track every expense.</p><p>Most people are surprised by how much they spend on non-essentials once they start tracking.</p>',
            'excerpt' => 'Discover the power of expense tracking for financial success.'
        ),
        array(
            'title' => 'The 50/30/20 Budget Rule',
            'content' => '<p>This simple budgeting framework suggests allocating 50% of income to needs, 30% to wants, and 20% to savings and debt repayment.</p><p>Its flexibility makes it easy to follow while ensuring you prioritize both present enjoyment and future security.</p>',
            'excerpt' => 'A simple framework for balanced financial planning.'
        ),
        array(
            'title' => 'Automate Your Savings',
            'content' => '<p>Set up automatic transfers to your savings account on payday. What you do not see, you will not spend.</p><p>Even small automatic contributions add up significantly over time through compound growth.</p>',
            'excerpt' => 'Make saving effortless with automation.'
        ),
        array(
            'title' => 'Review Subscriptions Monthly',
            'content' => '<p>Unused subscriptions can drain hundreds of dollars annually. Review all recurring charges monthly and cancel anything you do not actively use.</p><p>Consider sharing family plans for streaming services and other subscriptions.</p>',
            'excerpt' => 'Stop subscription creep from eating your budget.'
        )
    );

    foreach ($financial_tips as $tip) {
        wp_insert_post(array(
            'post_type' => 'financial_tip',
            'post_title' => $tip['title'],
            'post_content' => $tip['content'],
            'post_excerpt' => $tip['excerpt'],
            'post_status' => 'publish'
        ));
    }

    $news_articles = array(
        array(
            'title' => 'Personal Finance App Kenfinly Launches New Features',
            'content' => '<p>Kenfinly, the popular personal finance management application, has announced a suite of new features designed to help users better manage their money.</p><p>The update includes enhanced categorization, collaborative account sharing, and improved analytics dashboards.</p>',
            'excerpt' => 'Major update brings collaborative features and enhanced analytics.'
        ),
        array(
            'title' => 'Understanding Market Volatility in 2025',
            'content' => '<p>As markets continue to show volatility, financial advisors recommend maintaining a long-term perspective and diversified portfolio.</p><p>Key strategies include dollar-cost averaging, rebalancing portfolios regularly, and avoiding emotional decision-making.</p>',
            'excerpt' => 'Expert advice for navigating uncertain markets.'
        ),
        array(
            'title' => 'Tax Planning Tips for the New Year',
            'content' => '<p>Start the year right with proactive tax planning. Maximize retirement contributions, review your withholdings, and organize your documentation early.</p><p>Consider meeting with a tax professional to identify deductions and credits you might be missing.</p>',
            'excerpt' => 'Prepare now for a smoother tax season.'
        )
    );

    foreach ($news_articles as $article) {
        wp_insert_post(array(
            'post_type' => 'news',
            'post_title' => $article['title'],
            'post_content' => $article['content'],
            'post_excerpt' => $article['excerpt'],
            'post_status' => 'publish'
        ));
    }

    $faqs = array(
        array(
            'title' => 'How do I create a new account?',
            'content' => '<p>To create a new account in Kenfinly, go to the Accounts section and click the "Add Account" button. Enter your account name, choose an icon and color, and set the initial balance. Your new account will be ready to use immediately.</p>'
        ),
        array(
            'title' => 'Can I share an account with family members?',
            'content' => '<p>Yes! Kenfinly supports collaborative account management. Account owners can invite family members or trusted users to view or edit shared accounts. Go to Account Settings and use the "Invite Participant" feature to send invitations.</p>'
        ),
        array(
            'title' => 'How do I export my transaction data?',
            'content' => '<p>You can export your transactions to CSV format from the Analytics section. Click "Export Data", select your date range and accounts, then download the file. The export includes all transaction details for easy analysis in spreadsheet applications.</p>'
        ),
        array(
            'title' => 'Is my financial data secure?',
            'content' => '<p>Absolutely. Kenfinly uses industry-standard encryption for all data transmission and storage. We never store your bank credentials, and all user authentication is protected with JWT tokens and secure password hashing.</p>'
        ),
        array(
            'title' => 'What currencies does Kenfinly support?',
            'content' => '<p>Kenfinly supports multiple currencies including USD, EUR, GBP, VND, and many others. Each account can have its own currency, and the dashboard shows aggregated totals in your preferred base currency.</p>'
        )
    );

    foreach ($faqs as $faq) {
        wp_insert_post(array(
            'post_type' => 'faq',
            'post_title' => $faq['title'],
            'post_content' => $faq['content'],
            'post_status' => 'publish'
        ));
    }

    $welcome_post = wp_insert_post(array(
        'post_type' => 'post',
        'post_title' => 'Welcome to Kenfinly Blog',
        'post_content' => '<p>Welcome to the official Kenfinly blog! Here you will find financial tips, product updates, and insights to help you manage your money better.</p><p>Stay tuned for regular updates and feel free to explore our content through our headless CMS API.</p>',
        'post_excerpt' => 'Welcome to our official blog for financial insights and updates.',
        'post_status' => 'publish'
    ));

    update_option('headless_sample_data_seeded', true);
    
    return true;
}

register_activation_hook(__FILE__, 'headless_seed_sample_data');

add_action('admin_init', function() {
    if (isset($_GET['seed_sample_data']) && current_user_can('manage_options')) {
        headless_seed_sample_data();
        wp_redirect(admin_url('?sample_data_seeded=1'));
        exit;
    }
});

add_action('admin_notices', function() {
    if (isset($_GET['sample_data_seeded'])) {
        echo '<div class="notice notice-success"><p>Sample data has been seeded successfully!</p></div>';
    }
    
    if (!get_option('headless_sample_data_seeded')) {
        echo '<div class="notice notice-info"><p>Sample data not yet seeded. <a href="' . admin_url('?seed_sample_data=1') . '">Click here to seed sample content</a>.</p></div>';
    }
});
