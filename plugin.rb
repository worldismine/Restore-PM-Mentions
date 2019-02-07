# name: restore-pm-mentions
# version: 0.1.0
# authors: Muhlis Budi Cahyono (muhlisbc@gmail.com)

enabled_site_setting :restore_pm_mentions_enabled

after_initialize {

  require_dependency "post_alerter"
  class ::PostAlerter

    alias_method :orig_only_allowed_users, :only_allowed_users

    def only_allowed_users(users, post)
      return orig_only_allowed_users(users, post) if !SiteSetting.restore_pm_mentions_enabled

      users.select { |u| allowed_users(post).include?(u) || u.admin }
    end

  end

}