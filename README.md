# Register specification GitHub action

This action validates and creates optimization model formulations from version
controlled sources.

_**Deprecation notice**: This action is deprecated in favor of using the
[CLI][cli] or the [Python SDK][python-sdk]'s entry point directly._

## Inputs

### `token`

**Required** Opvious API access token. You can create one here:
https://hub.beta.opvious.io/authorizations.

### `sources`

**Required** Specification sources. This can either be a single string glob or a
YAML list of objects (see below).

When a single glob is passed in, each matched file will be considered a
self-contained specification. The name of the formulation will be derived from
the file's name by stripping the extension. The specification's description will
be set to the file's contents.

When a list of objects are passed in, each is expected to describe a single
specification and should contain the following fields:

* `name` (required), the name of the formulation
* `sources` (required), glob of source files
* `description` (optional), path of file to use as description, defaults to the
  concatenated contents of all source files

Examples:

```yaml
  # Single glob
  sources: sources/*.md

  # Multiple specifications
  sources: |
    - name: first-formulation
      sources: sources/first.md
    - name: second-formulation
      sources: sources/second/*.md
      description: sources/second/README.md
```

### `tags`

Tag name(s) to apply to registered formulations. Multiple tags can be expressed
via a YAML list. Unused in dry-run mode.

Examples:

```yaml
  # Single tag
  tags: golden

  # Multiple tags
  tags: |
    - golden
    - github
```

### `dry-run`

If true, specifications will only be validated (and not registered). Defaults to
false.

### `domain`

Opvious platform domain. You should only need to set this if you are using a
self-hosted cluster. Defaults to the default production endpoint.

## Example usage

```yaml
uses: opvious/register-specification-action@beta
with:
  token: ${{ secrets.OPVIOUS_TOKEN }}
  sources: sources/*.md
```

See the [guide][] for more examples.

[guide]: https://docs.opvious.io/guides/integrations/github-actions#register-specification-action
[cli]: https://www.npmjs.com/package/opvious-cli
[python-sdk]: https://pypi.org/project/opvious/
