
export type PerClientResponse = {
	data: {
		completions: Completion[],
		snippets: Completion[]
	}
}


export interface Completion {
    /**
    The label to show in the completion picker. This is what input
    is matched against to determine whether a completion matches (and
    how well it matches).
    */
    label: string;
    /**
    An optional override for the completion's visible label. When
    using this, matched characters will only be highlighted if you
    provide a [`getMatch`](https://codemirror.net/6/docs/ref/#autocomplete.CompletionResult.getMatch)
    function.
    */
    displayLabel?: string;
    /**
    An optional short piece of information to show (with a different
    style) after the label.
    */
    detail?: string;
    /**
    Additional info to show when the completion is selected. Can be
    a plain string or a function that'll render the DOM structure to
    show when invoked.
    */
    info?: string;
    /**
    The type of the completion. This is used to pick an icon to show
    for the completion. Icons are styled with a CSS class created by
    appending the type name to `"cm-completionIcon-"`. You can
    define or restyle icons by defining these selectors. The base
    library defines simple icons for `class`, `constant`, `enum`,
    `function`, `interface`, `keyword`, `method`, `namespace`,
    `property`, `text`, `type`, and `variable`.

    Multiple types can be provided by separating them with spaces.
    */
    type?: string;
    /**
    When given, should be a number from -99 to 99 that adjusts how
    this completion is ranked compared to other completions that
    match the input as well as this one. A negative number moves it
    down the list, a positive number moves it up.
    */
    boost?: number;
    /**
    Can be used to divide the completion list into sections.
    Completions in a given section (matched by name) will be grouped
    together, with a heading above them. Options without section
    will appear above all sections. A string value is equivalent to
    a `{name}` object.
    */
    section?: string | CompletionSection;
}

export interface CompletionSection {
    /**
    The name of the section. If no `render` method is present, this
    will be displayed above the options.
    */
    name: string;
    /**
    An optional function that renders the section header. Since the
    headers are shown inside a list, you should make sure the
    resulting element has a `display: list-item` style.
    */
    header?: (section: CompletionSection) => HTMLElement;
    /**
    By default, sections are ordered alphabetically by name. To
    specify an explicit order, `rank` can be used. Sections with a
    lower rank will be shown above sections with a higher rank.
    */
    rank?: number;
}
