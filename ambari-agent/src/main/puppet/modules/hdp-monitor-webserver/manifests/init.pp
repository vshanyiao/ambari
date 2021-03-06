#
#
# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
#
#
class hdp-monitor-webserver( 
  $service_state = $hdp::params::cluster_service_state,
  $opts = {}
) inherits hdp::params 
{
  #TODO: does not install apache package
  if ($service_state == 'no_op') {
  } elsif ($service_state in ['running','stopped','installed_and_configured']) {
    if ($service_state == 'running') {
      #TODO: refine by using notify/subscribe
      hdp::exec { 'monitor webserver start':
        command => '/etc/init.d/httpd start',
        unless => '/etc/init.d/httpd status'
      } 
    } elsif ($service_state == 'stopped') {
      package { 'httpd':
        ensure => 'stopped'
      }
    }
  } else {
    hdp_fail("TODO not implemented yet: service_state = ${service_state}")
  }
}
