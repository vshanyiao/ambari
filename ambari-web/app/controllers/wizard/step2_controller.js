/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var App = require('app');

App.WizardStep2Controller = Em.Controller.extend({
  name: 'wizardStep2Controller',
  hostNameArr: [],
  isPattern: false,
  bootRequestId:  null,
  hasSubmitted: false,

  hostNames: function () {
    return this.get('content.hosts.hostNames');
  }.property('content.hosts.hostNames'),

  manualInstall: function () {
    return this.get('content.hosts.manualInstall');
  }.property('content.hosts.manualInstall'),

  localRepo: function () {
    return this.get('content.hosts.localRepo');
  }.property('content.hosts.localRepo'),

  sshKey: function () {
    return this.get('content.hosts.sshKey');
  }.property('content.hosts.sshKey'),

  passphrase: function () {
    return this.get('content.hosts.passphrase');
  }.property('content.hosts.passphrase'),

  confirmPassphrase: function () {
    return this.get('content.hosts.confirmPassphrase');
  }.property('content.hosts.confirmPassphrase'),

  installType: function () {
    if (this.get('manualInstall') === true) {
      return 'manualDriven';
    } else {
      return 'ambariDriven';
    }
  }.property('manualInstall'),

  isHostNameValid: function (hostname) {
    // For now hostnames that start or end with '-' are not allowed
    return !(/^\-/.test(hostname) || /\-$/.test(hostname));
  },

  isAllHostNamesValid: function () {
    this.hostNameArr = this.get('hostNames').trim().split(new RegExp("\\s+", "g"));
    for (var index in this.hostNameArr) {
      if (!this.isHostNameValid(this.hostNameArr[index])) {
        return false;
      }
    }
    return true;
  },

  hostsError: function () {
    if (this.get('hasSubmitted') && this.get('hostNames').trim() === '') {
      return Em.I18n.t('installer.step2.hostName.error.required');
    } else if (this.isAllHostNamesValid() === false) {
      return Em.I18n.t('installer.step2.hostName.error.invalid');
    }
    return null;
  }.property('hostNames', 'manualInstall', 'hasSubmitted'),

  sshKeyError: function () {
    if (this.get('hasSubmitted') && this.get('manualInstall') === false && this.get('sshKey').trim() === '') {
      return Em.I18n.t('installer.step2.sshKey.error.required');
    }
    return null;
  }.property('sshKey', 'manualInstall', 'hasSubmitted'),

  /**
   * Get host info, which will be saved in parent controller
   */
  getHostInfo: function () {

    var hostNameArr = this.get('hostNameArr');
    var hostInfo = {};
    for (var i = 0; i < hostNameArr.length; i++) {
      hostInfo[hostNameArr[i]] = {
        name: hostNameArr[i],
        installType: this.get('installType'),
        bootStatus: 'PENDING'
      };
    }

    return hostInfo;
  },

  /**
   * Onclick handler for <code>next button</code>. Do all UI work except data saving.
   * This work is doing by router.
   * @return {Boolean}
   */
  evaluateStep: function () {
    console.log('TRACE: Entering controller:WizardStep2:evaluateStep function');

    if (this.get('isSubmitDisabled')) {
      return false;
    }

    if(this.isPattern)
    {
      this.hostNamePatternPopup(this.hostNameArr);
      return false;
    }

    this.proceedNext();

  },

  patternExpression: function(){
    var self = this;
    var hostNames = [];
    $.each(this.hostNameArr, function(e,a){
      var start, end, extra = "";
      if(/\[\d*\-\d*\]/.test(a)){
        start=a.match(/\[\d*/);
        end=a.match(/\-\d*/);
        start=start[0].substr(1);
        end=end[0].substr(1);

        if(parseInt(start) <= parseInt(end) && parseInt(start) >= 0){
          self.isPattern = true;
          if(start[0] == "0" && start.length > 1)
          {
            extra = start[0];
          }
          for (var i = parseInt(start); i < parseInt(end) + 1; i++) {
            hostNames.push(a.replace(/\[\d*\-\d*\]/, extra+i ))
          }
        }
      }else{
        hostNames.push(a);
      }
    });
    this.hostNameArr =  hostNames;
  },

  proceedNext: function(){
    if (this.get('manualInstall') === true) {
      this.manualInstallPopup();
      return false;
    }

    var bootStrapData = JSON.stringify({'verbose': true, 'sshKey': this.get('sshKey'), hosts: this.get('hostNameArr')});

    if (App.skipBootstrap) {
      App.router.send('next');
      return true;
    }

    var requestId = App.router.get(this.get('content.controllerName')).launchBootstrap(bootStrapData);
    if(requestId) {
      this.set('bootRequestId',requestId);
      App.router.send('next');
    }
  },

  hostNamePatternPopup: function (hostNames) {
    var self = this;
    App.ModalPopup.show({
      header: Em.I18n.t('installer.step2.hostName.pattern.header'),
      onPrimary: function () {
        self.proceedNext();
        this.hide();
      },
      bodyClass: Ember.View.extend({
        template: Ember.Handlebars.compile(['{{#each host in view.hostNames}}<p>{{host}}</p>{{/each}}'].join('\n')),
        hostNames: hostNames
      })
    });
  },

  manualInstallPopup: function (event) {
    App.ModalPopup.show({
      header: Em.I18n.t('installer.step2.manualInstall.popup.header'),
      onPrimary: function () {
        this.hide();
        App.router.send('next');
      },
      bodyClass: Ember.View.extend({
        templateName: require('templates/wizard/step2ManualInstallPopup')
      })
    });
  },

  isSubmitDisabled: function () {
    return (this.get('hostsError') || this.get('sshKeyError'));
  }.property('hostsError', 'sshKeyError')

});
