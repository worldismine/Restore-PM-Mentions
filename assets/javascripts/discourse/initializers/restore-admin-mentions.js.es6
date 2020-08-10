import { withPluginApi } from "discourse/lib/plugin-api";

function initWithApi(api) {
  if (!Discourse.SiteSettings.restore_pm_mentions_enabled) return;

  api.modifyClass("controller:composer", {
    actions: {
      save() {
        if (!this.currentUser.staff) {
          let mentioned = 0;
          const callback = () => {
            this.save();
          };

          $(".d-editor-preview a.mention-group").each(function() {
            const group = $(this)
              .text()
              .toLowerCase()
              .trim();

            if (group === "@admins" || group === "@administrators") {
              mentioned++;
            }
          });

          if (mentioned) {
            const msg = I18n.t("restore_pm_mentions.alert");
            const buttons = [
              {
                label: I18n.t("restore_pm_mentions.back"),
                class: "btn-default"
              },
              {
                label: I18n.t("restore_pm_mentions.proceed"),
                class: "btn-danger",
                callback
              }
            ];

            const bb = bootbox.dialog(msg, buttons);

            bb.addClass("confirm-mention-admin");

            return bb;
          }
        }

        return this._super(...arguments);
      }
    }
  });
}

export default {
  name: "restore-admin-mentions",
  initialize() {
    withPluginApi("0.8", initWithApi);
  }
};
