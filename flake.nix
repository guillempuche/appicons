{
  description = "appicons - Generate app icons, splash screens, and adaptive icons";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            bun
            nodejs_24
            typescript
            biome
            lefthook
          ];

          shellHook = ''
            echo ""
            echo "appicons"
            echo "Bun $(bun --version)"
            echo "Biome $(biome --version)"
            echo ""

            # Install lefthook git hooks
            lefthook install 2>/dev/null || true
          '';
        };
      });
}
