import { withPluginApi } from "discourse/lib/plugin-api";
import { inject as service } from "@ember/service";
import { htmlSafe } from "@ember/template";

function initWithApi(api) {
  const siteSettings = api.container.lookup("site-settings:main");
  if (!siteSettings.restore_pm_mentions_enabled) return;

  // the plugin allows mentioning @admins but we get a warning for that, so we must suppress it
  // for some reason we are unable to override controller:composer cannotSeeMention()
  // so we resort to overriding this one and add admins to the list of stuff we've already warned for
  // this effectively suppresses the warning

  api.modifyClass("component:composer-editor", {
    pluginId: "discourse-restore-pm-mentions",
    _warnCannotSeeMention(...args) {
      this.warnedCannotSeeMentions.push('admins');
      this.warnedCannotSeeMentions.push('administrators');
      return this._super(...args);
    },
  });

  api.modifyClass("controller:composer", {
    pluginId: "discourse-restore-pm-mentions",
    dialog: service(),

    save(...args) {
      const _this = this;
      const _super = this._super;

      if (this.currentUser.staff) {
        return this._super(...args);
      }

      let mentioned = 0;
       $(".d-editor-preview a.mention-group").each(function() {
        const group = $(this)
          .text()
          .toLowerCase()
          .trim();

        if (group === "@admins" || group === "@administrators") {
          mentioned++;
        }
      });

      if (!mentioned) {
        return this._super(...args);
      }

      this.dialog.confirm({
        message: htmlSafe(I18n.t("restore_pm_mentions.alert")),
        shouldDisplayCancel: false,
        confirmButtonLabel: "restore_pm_mentions.proceed",
        confirmButtonClass: "btn-danger",
        didConfirm: () => {
          return _super.call(_this, ...args);
        },
        cancelButtonLabel: "restore_pm_mentions.back",
        cancelButtonClass: "btn-default",
        didCancel: () => {
          // cancel
        },
      });
    }
  });
}

export default {
  name: "restore-admin-mentions",
  initialize() {
    withPluginApi("0.8", initWithApi);
  }
};
