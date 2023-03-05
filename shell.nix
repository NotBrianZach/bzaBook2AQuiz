let
  nixpkgs.url = "https://github.com/NixOS/nixpkgs/archive/nixos-20.03.tar.gz";
  nixpkgs.sha256 = "93c88b82d3e3c3e2e3c7819a26fe9e9c3e3f3a3b3c3f3a3b3c3f3a3b382d3e3f";
in
{ pkgs ? import <nixpkgs> {} }:

let
  # all binary requirements of pdf-extract npm package
  pdftk = pkgs.pdftk;
  pdftotext = pkgs.poppler;
  ghostscript = pkgs.ghostscript;
  tesseractjs = pkgs.tesseract4;
in

pkgs.stdenv.mkDerivation {
  name = "nix-shell-pdftk-pdftotext-ghostscript-tesseractjs";

  buildInputs = [
    pkgs.nodejs

    # reading list util
    pkgs.jq


    # all binary requirements of pdf-extract npm package
    pdftk
    pdftotext
    ghostscript
    tesseractjs
  ];
}
