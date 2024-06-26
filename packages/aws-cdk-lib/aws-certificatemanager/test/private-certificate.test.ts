import { Match, Template } from '../../assertions';
import * as acmpca from '../../aws-acmpca';
import { Duration, Lazy, Stack } from '../../core';
import { KeyAlgorithm, PrivateCertificate } from '../lib';

test('private certificate authority', () => {
  const stack = new Stack();

  new PrivateCertificate(stack, 'Certificate', {
    domainName: 'test.example.com',
    certificateAuthority: acmpca.CertificateAuthority.fromCertificateAuthorityArn(stack, 'CA',
      'arn:aws:acm-pca:us-east-1:123456789012:certificate-authority/023077d8-2bfa-4eb0-8f22-05c96deade77'),
  });

  Template.fromStack(stack).hasResourceProperties('AWS::CertificateManager::Certificate', {
    DomainName: 'test.example.com',
    CertificateAuthorityArn: 'arn:aws:acm-pca:us-east-1:123456789012:certificate-authority/023077d8-2bfa-4eb0-8f22-05c96deade77',
  });
});

test('private certificate authority with subjectAlternativeNames', () => {
  const stack = new Stack();

  new PrivateCertificate(stack, 'Certificate', {
    domainName: 'test.example.com',
    subjectAlternativeNames: ['extra.example.com'],
    certificateAuthority: acmpca.CertificateAuthority.fromCertificateAuthorityArn(stack, 'CA',
      'arn:aws:acm-pca:us-east-1:123456789012:certificate-authority/023077d8-2bfa-4eb0-8f22-05c96deade77'),
  });

  Template.fromStack(stack).hasResourceProperties('AWS::CertificateManager::Certificate', {
    DomainName: 'test.example.com',
    SubjectAlternativeNames: ['extra.example.com'],
    CertificateAuthorityArn: 'arn:aws:acm-pca:us-east-1:123456789012:certificate-authority/023077d8-2bfa-4eb0-8f22-05c96deade77',
  });
});

test('private certificate authority with multiple subjectAlternativeNames', () => {
  const stack = new Stack();

  new PrivateCertificate(stack, 'Certificate', {
    domainName: 'test.example.com',
    subjectAlternativeNames: ['*.test.example.com', '*.foo.test.example.com', 'bar.test.example.com'],
    certificateAuthority: acmpca.CertificateAuthority.fromCertificateAuthorityArn(stack, 'CA',
      'arn:aws:acm-pca:us-east-1:123456789012:certificate-authority/023077d8-2bfa-4eb0-8f22-05c96deade77'),
  });

  Template.fromStack(stack).hasResourceProperties('AWS::CertificateManager::Certificate', {
    DomainName: 'test.example.com',
    SubjectAlternativeNames: ['*.test.example.com', '*.foo.test.example.com', 'bar.test.example.com'],
    CertificateAuthorityArn: 'arn:aws:acm-pca:us-east-1:123456789012:certificate-authority/023077d8-2bfa-4eb0-8f22-05c96deade77',
  });
});

test('private certificate authority with tokens', () => {
  const stack = new Stack();

  const certificateAuthority = Lazy.string({
    produce: () => 'arn:aws:acm-pca:us-east-1:123456789012:certificate-authority/023077d8-2bfa-4eb0-8f22-05c96deade77',
  });

  const domainName = Lazy.string({
    produce: () => 'test.example.com',
  });

  const domainNameAlternative = Lazy.string({
    produce: () => 'extra.example.com',
  });

  new PrivateCertificate(stack, 'Certificate', {
    domainName,
    subjectAlternativeNames: [domainNameAlternative],
    certificateAuthority: acmpca.CertificateAuthority.fromCertificateAuthorityArn(stack, 'CA', certificateAuthority),
  });

  Template.fromStack(stack).hasResourceProperties('AWS::CertificateManager::Certificate', {
    DomainName: 'test.example.com',
    SubjectAlternativeNames: ['extra.example.com'],
    CertificateAuthorityArn: 'arn:aws:acm-pca:us-east-1:123456789012:certificate-authority/023077d8-2bfa-4eb0-8f22-05c96deade77',
  });
});

test('metricDaysToExpiry', () => {
  const stack = new Stack();

  const certificate = new PrivateCertificate(stack, 'Certificate', {
    domainName: 'test.example.com',
    certificateAuthority: acmpca.CertificateAuthority.fromCertificateAuthorityArn(stack, 'CA',
      'arn:aws:acm-pca:us-east-1:123456789012:certificate-authority/023077d8-2bfa-4eb0-8f22-05c96deade77'),
  });

  expect(stack.resolve(certificate.metricDaysToExpiry().toMetricConfig())).toEqual({
    metricStat: {
      dimensions: [{ name: 'CertificateArn', value: stack.resolve(certificate.certificateArn) }],
      metricName: 'DaysToExpiry',
      namespace: 'AWS/CertificateManager',
      period: Duration.days(1),
      statistic: 'Minimum',
    },
    renderingProperties: expect.anything(),
  });
});

describe('Key Algorithm', () => {
  test('key algorithm is undefined if not provided', () => {
    const stack = new Stack();

    new PrivateCertificate(stack, 'Certificate', {
      domainName: 'test.example.com',
      certificateAuthority: acmpca.CertificateAuthority.fromCertificateAuthorityArn(stack, 'CA',
        'arn:aws:acm-pca:us-east-1:123456789012:certificate-authority/023077d8-2bfa-4eb0-8f22-05c96deade77'),
    });

    Template.fromStack(stack).hasResourceProperties('AWS::CertificateManager::Certificate', {
      KeyAlgorithm: Match.absent(),
    });
  });

  test('Can specify algorithm', () => {
    const stack = new Stack();

    new PrivateCertificate(stack, 'Certificate', {
      domainName: 'test.example.com',
      certificateAuthority: acmpca.CertificateAuthority.fromCertificateAuthorityArn(stack, 'CA',
        'arn:aws:acm-pca:us-east-1:123456789012:certificate-authority/023077d8-2bfa-4eb0-8f22-05c96deade77'),
      keyAlgorithm: KeyAlgorithm.EC_SECP384R1,
    });

    Template.fromStack(stack).hasResourceProperties('AWS::CertificateManager::Certificate', {
      KeyAlgorithm: 'EC_secp384r1',
    });
  });

  test('Can specify any arbitrary algorithm', () => {
    const stack = new Stack();

    new PrivateCertificate(stack, 'Certificate', {
      domainName: 'test.example.com',
      certificateAuthority: acmpca.CertificateAuthority.fromCertificateAuthorityArn(stack, 'CA',
        'arn:aws:acm-pca:us-east-1:123456789012:certificate-authority/023077d8-2bfa-4eb0-8f22-05c96deade77'),
      keyAlgorithm: new KeyAlgorithm('any value'),
    });

    Template.fromStack(stack).hasResourceProperties('AWS::CertificateManager::Certificate', {
      KeyAlgorithm: 'any value',
    });
  });
});
