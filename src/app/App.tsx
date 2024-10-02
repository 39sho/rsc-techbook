import { Suspense } from "react";
import { Action } from "./Action";
import { ActionFn, FormActionFn } from "./ActionFn";
import { Counter } from "./Counter";
import { Sleep } from "./Sleep";

const App = () => {
	return (
		<div>
			<div>Hello!</div>
			<Counter />
			<Action action={ActionFn} />
			<Suspense fallback="loading...">
				<Sleep />
			</Suspense>
			<form action={FormActionFn}>
				<button type="submit">action [form]</button>
			</form>
		</div>
	);
};

export { App };
