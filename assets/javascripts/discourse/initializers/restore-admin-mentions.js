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

  // Since Discourse 3.4 that method does not work anymore
  // it yields "Uncaught (in promise) TypeError: "_warnCannotSeeMention" is read-only"
  // Luckily enough, a good friend suggested this workaround
  // "you can try modifying the method before it's used"

  api.modifyClass("component:composer-editor", {
    pluginId: "discourse-restore-pm-mentions",

    didInsertElement() {
      this._super(...arguments);

      let originalWarn = this._warnCannotSeeMention.bind(this);

      Object.defineProperty(this, "_warnCannotSeeMention", {
        value: (...args) => {
          this.warnedCannotSeeMentions.push("admins");
          this.warnedCannotSeeMentions.push("administrators");
          return originalWarn(...args);
        },
        writable: false,
        configurable: true, // Allow future modifications
      });
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
