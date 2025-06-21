# name: discourse-restore-pm-mentions
# version: 3.4.1
# authors: Muhlis Budi Cahyono (muhlisbc@gmail.com) and richard@communiteq.com
# url: https://github.com/worldismine/Restore-PM-Mentions

enabled_site_setting :restore_pm_mentions_enabled

register_asset "stylesheets/restore-admin-mentions/mobile.scss", :mobile

after_initialize do
  require_dependency "post_alerter"
  class ::PostAlerter
    alias_method :orig_only_allowed_users, :only_allowed_users

    def only_allowed_users(users, post)
      return orig_only_allowed_users(users, post) if !SiteSetting.restore_pm_mentions_enabled

      return users unless post.topic.private_message?
      users.select { |u| allowed_users(post).include?(u) || u.admin }
    end
  end
end
