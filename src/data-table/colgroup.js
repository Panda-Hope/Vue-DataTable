export default {
    name: "TableColgroup",
    props: ["columns"],
    render(h) {
        return (
            <colgroup>
                {
                    this.columns.map(column => {
                        return (
                            <col style={{width: column.width}} />
                        );
                    })
                }
            </colgroup>
        );
    }
};
