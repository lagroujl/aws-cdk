import { Template } from '../../../assertions';
import { HttpApi, HttpMethod, HttpRoute, HttpRouteKey, MappingValue, ParameterMapping, VpcLink } from '../../../aws-apigatewayv2';
import * as ec2 from '../../../aws-ec2';
import * as elbv2 from '../../../aws-elasticloadbalancingv2';
import { Duration, Stack } from '../../../core';
import { HttpAlbIntegration } from '../../lib';

describe('HttpAlbIntegration', () => {
  test('default', () => {
    // GIVEN
    const stack = new Stack();
    const vpc = new ec2.Vpc(stack, 'VPC');
    const lb = new elbv2.ApplicationLoadBalancer(stack, 'lb', { vpc });
    const listener = lb.addListener('listener', { port: 80 });
    listener.addTargets('target', { port: 80 });

    // WHEN
    const api = new HttpApi(stack, 'HttpApi');
    new HttpRoute(stack, 'HttpProxyPrivateRoute', {
      httpApi: api,
      integration: new HttpAlbIntegration('Integration', listener),
      routeKey: HttpRouteKey.with('/pets'),
    });

    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::ApiGatewayV2::Integration', {
      IntegrationType: 'HTTP_PROXY',
      ConnectionId: {
        Ref: 'HttpApiVpcLink159804837',
      },
      ConnectionType: 'VPC_LINK',
      IntegrationMethod: 'ANY',
      IntegrationUri: {
        Ref: 'lblistener657ADDEC',
      },
      PayloadFormatVersion: '1.0',
    });
  });

  test('able to add a custom vpcLink', () => {
    // GIVEN
    const stack = new Stack();
    const vpc = new ec2.Vpc(stack, 'VPC');
    const vpcLink = new VpcLink(stack, 'VpcLink', { vpc });
    const lb = new elbv2.ApplicationLoadBalancer(stack, 'lb', { vpc });
    const listener = lb.addListener('listener', { port: 80 });
    listener.addTargets('target', { port: 80 });

    // WHEN
    const api = new HttpApi(stack, 'HttpApi');
    new HttpRoute(stack, 'HttpProxyPrivateRoute', {
      httpApi: api,
      integration: new HttpAlbIntegration('Integration', listener, { vpcLink }),
      routeKey: HttpRouteKey.with('/pets'),
    });

    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::ApiGatewayV2::Integration', {
      IntegrationType: 'HTTP_PROXY',
      ConnectionId: {
        Ref: 'VpcLink42ED6FF0',
      },
      ConnectionType: 'VPC_LINK',
      IntegrationMethod: 'ANY',
      IntegrationUri: {
        Ref: 'lblistener657ADDEC',
      },
      PayloadFormatVersion: '1.0',
    });
  });

  test('method option is correctly recognized', () => {
    // GIVEN
    const stack = new Stack();
    const vpc = new ec2.Vpc(stack, 'VPC');
    const lb = new elbv2.ApplicationLoadBalancer(stack, 'lb', { vpc });
    const listener = lb.addListener('listener', { port: 80 });
    listener.addTargets('target', { port: 80 });

    // WHEN
    const api = new HttpApi(stack, 'HttpApi');
    new HttpRoute(stack, 'HttpProxyPrivateRoute', {
      httpApi: api,
      integration: new HttpAlbIntegration('Integration', listener, { method: HttpMethod.PATCH }),
      routeKey: HttpRouteKey.with('/pets'),
    });

    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::ApiGatewayV2::Integration', {
      IntegrationMethod: 'PATCH',
    });
  });

  test('timeout option is correctly recognized', () => {
    // GIVEN
    const stack = new Stack();
    const vpc = new ec2.Vpc(stack, 'VPC');
    const lb = new elbv2.ApplicationLoadBalancer(stack, 'lb', { vpc });
    const listener = lb.addListener('listener', { port: 80 });
    listener.addTargets('target', { port: 80 });

    // WHEN
    const api = new HttpApi(stack, 'HttpApi');
    new HttpRoute(stack, 'HttpProxyPrivateRoute', {
      httpApi: api,
      integration: new HttpAlbIntegration('Integration', listener, { timeout: Duration.seconds(20) }),
      routeKey: HttpRouteKey.with('/pets'),
    });

    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::ApiGatewayV2::Integration', {
      TimeoutInMillis: 20000,
    });
  });

  test('fails when imported ALB is used without specifying load balancer', () => {
    const stack = new Stack();
    const securityGroup = ec2.SecurityGroup.fromSecurityGroupId(stack, 'MySecurityGroup', 'sg-903004f8');
    const listener = elbv2.ApplicationListener.fromApplicationListenerAttributes(stack, 'Listener', {
      listenerArn: 'arn:aws:elasticloadbalancing:us-east-1:012345655:listener/app/myloadbalancer/lb-12345/listener-12345',
      securityGroup,
    });
    const api = new HttpApi(stack, 'HttpApi');

    expect(() => new HttpRoute(stack, 'HttpProxyPrivateRoute', {
      httpApi: api,
      integration: new HttpAlbIntegration('Integration', listener),
      routeKey: HttpRouteKey.with('/pets'),
    })).toThrow(/vpcLink property must be specified/);
  });

  test('tlsConfig option is correctly recognized', () => {
    // GIVEN
    const stack = new Stack();
    const vpc = new ec2.Vpc(stack, 'VPC');
    const lb = new elbv2.ApplicationLoadBalancer(stack, 'lb', { vpc });
    const listener = lb.addListener('listener', { port: 80 });
    listener.addTargets('target', { port: 80 });

    // WHEN
    const api = new HttpApi(stack, 'HttpApi');
    new HttpRoute(stack, 'HttpProxyPrivateRoute', {
      httpApi: api,
      integration: new HttpAlbIntegration('Integration', listener, { secureServerName: 'name-to-verify' }),
      routeKey: HttpRouteKey.with('/pets'),
    });

    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::ApiGatewayV2::Integration', {
      TlsConfig: {
        ServerNameToVerify: 'name-to-verify',
      },
    });
  });

  test('parameterMapping option is correctly recognized', () => {
    // GIVEN
    const stack = new Stack();
    const vpc = new ec2.Vpc(stack, 'VPC');
    const lb = new elbv2.ApplicationLoadBalancer(stack, 'lb', { vpc });
    const listener = lb.addListener('listener', { port: 80 });
    listener.addTargets('target', { port: 80 });

    // WHEN
    const api = new HttpApi(stack, 'HttpApi');
    new HttpRoute(stack, 'HttpProxyPrivateRoute', {
      httpApi: api,
      integration: new HttpAlbIntegration('Integration', listener, {
        parameterMapping: new ParameterMapping()
          .appendHeader('header2', MappingValue.requestHeader('header1'))
          .removeHeader('header1'),
      }),
      routeKey: HttpRouteKey.with('/pets'),
    });

    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::ApiGatewayV2::Integration', {
      RequestParameters: {
        'append:header.header2': '$request.header.header1',
        'remove:header.header1': '',
      },
    });
  });
});
