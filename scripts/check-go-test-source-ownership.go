package main

import (
	"flag"
	"fmt"
	"go/ast"
	"go/parser"
	"go/token"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

func fail(format string, arguments ...any) {
	fmt.Fprintf(os.Stderr, format+"\n", arguments...)
	os.Exit(1)
}

func cleanAbsolute(path string) (string, error) {
	absolute, err := filepath.Abs(path)
	if err != nil {
		return "", err
	}
	return filepath.Clean(absolute), nil
}

func declaredFunctions(path string) ([]string, error) {
	fileSet := token.NewFileSet()
	file, err := parser.ParseFile(fileSet, path, nil, parser.SkipObjectResolution)
	if err != nil {
		return nil, err
	}
	names := make([]string, 0)
	for _, declaration := range file.Decls {
		function, ok := declaration.(*ast.FuncDecl)
		if ok && function.Recv == nil {
			names = append(names, function.Name.Name)
		}
	}
	return names, nil
}

func main() {
	workingDirectory := flag.String("working-directory", "", "directory containing the Go package")
	testName := flag.String("test", "", "exact top-level Go test function")
	ownedFile := flag.String("owned-file", "", "exact manifest-owned source file")
	flag.Parse()
	if flag.NArg() != 0 || *workingDirectory == "" || *testName == "" || *ownedFile == "" {
		fail("expected --working-directory, --test, and --owned-file exactly once")
	}

	directory, err := cleanAbsolute(*workingDirectory)
	if err != nil {
		fail("resolve working directory: %v", err)
	}
	owned, err := cleanAbsolute(*ownedFile)
	if err != nil {
		fail("resolve owned file: %v", err)
	}
	relative, err := filepath.Rel(directory, owned)
	if err != nil || relative == ".." || strings.HasPrefix(relative, ".."+string(filepath.Separator)) {
		fail("owned file is outside the Go package")
	}
	if filepath.Ext(owned) != ".go" || !strings.HasSuffix(owned, "_test.go") {
		fail("owned file is not a Go test source")
	}

	entries, err := os.ReadDir(directory)
	if err != nil {
		fail("read Go package: %v", err)
	}
	owners := make([]string, 0)
	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), "_test.go") {
			continue
		}
		path := filepath.Join(directory, entry.Name())
		names, parseErr := declaredFunctions(path)
		if parseErr != nil {
			fail("parse %s: %v", path, parseErr)
		}
		for _, name := range names {
			if name == *testName {
				owners = append(owners, path)
			}
		}
	}
	sort.Strings(owners)
	if len(owners) != 1 || owners[0] != owned {
		fail("test %s has owners %q, expected %q", *testName, owners, owned)
	}
}
